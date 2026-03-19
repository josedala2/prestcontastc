import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const DEMO_USERS = [
  { email: "admin@demo.tca.ao", password: "demo123456", nome: "Admin Demo", cargo: "Administrador do Sistema" },
  { email: "entidade@demo.tca.ao", password: "demo123456", nome: "Maria Santos", cargo: "Representante da Entidade" },
  { email: "secretaria@demo.tca.ao", password: "demo123456", nome: "João Ferreira", cargo: "Técnico da Secretaria-Geral" },
  { email: "chefe.secretaria@demo.tca.ao", password: "demo123456", nome: "Ana Oliveira", cargo: "Chefe da Secretaria-Geral" },
  { email: "contadoria@demo.tca.ao", password: "demo123456", nome: "Pedro Nunes", cargo: "Técnico da Contadoria Geral" },
  { email: "escrivao@demo.tca.ao", password: "demo123456", nome: "Carlos Silva", cargo: "Escrivão dos Autos" },
  { email: "contadoria.geral@demo.tca.ao", password: "demo123456", nome: "Teresa Costa", cargo: "Contadoria Geral" },
  { email: "chefe.divisao@demo.tca.ao", password: "demo123456", nome: "Manuel Dias", cargo: "Chefe de Divisão", divisao: "3ª Divisão" },
  { email: "chefe.seccao@demo.tca.ao", password: "demo123456", nome: "Sofia Lopes", cargo: "Chefe de Secção", divisao: "3ª Divisão" },
  { email: "chefe.divisao4@demo.tca.ao", password: "demo123456", nome: "Fernando Ribeiro", cargo: "Chefe de Divisão", divisao: "4ª Divisão" },
  { email: "chefe.seccao4@demo.tca.ao", password: "demo123456", nome: "Dulce Mendes", cargo: "Chefe de Secção", divisao: "4ª Divisão" },
  { email: "chefe.divisao5@demo.tca.ao", password: "demo123456", nome: "Augusto Fernandes", cargo: "Chefe de Divisão", divisao: "5ª Divisão" },
  { email: "chefe.seccao5@demo.tca.ao", password: "demo123456", nome: "Graça Tavares", cargo: "Chefe de Secção", divisao: "5ª Divisão" },
  { email: "chefe.divisao6@demo.tca.ao", password: "demo123456", nome: "Domingos Queiroz", cargo: "Chefe de Divisão", divisao: "6ª Divisão" },
  { email: "chefe.seccao6@demo.tca.ao", password: "demo123456", nome: "Valentina Pereira", cargo: "Chefe de Secção", divisao: "6ª Divisão" },
  { email: "chefe.divisao7@demo.tca.ao", password: "demo123456", nome: "Henrique Bento", cargo: "Chefe de Divisão", divisao: "7ª Divisão" },
  { email: "chefe.seccao7@demo.tca.ao", password: "demo123456", nome: "Esperança Gomes", cargo: "Chefe de Secção", divisao: "7ª Divisão" },
  { email: "chefe.divisao8@demo.tca.ao", password: "demo123456", nome: "Narciso Tomás", cargo: "Chefe de Divisão", divisao: "8ª Divisão" },
  { email: "chefe.seccao8@demo.tca.ao", password: "demo123456", nome: "Conceição Loureiro", cargo: "Chefe de Secção", divisao: "8ª Divisão" },
  { email: "tecnico.analise@demo.tca.ao", password: "demo123456", nome: "Rui Almeida", cargo: "Técnico de Análise" },
  { email: "tecnico.analise5@demo.tca.ao", password: "demo123456", nome: "Edson Machado", cargo: "Técnico de Análise", divisao: "5ª Divisão" },
  { email: "coordenador@demo.tca.ao", password: "demo123456", nome: "Luísa Mendes", cargo: "Coordenador de Equipa" },
  { email: "dst@demo.tca.ao", password: "demo123456", nome: "António Rocha", cargo: "Diretor dos Serviços Técnicos" },
  { email: "juiz.relator@demo.tca.ao", password: "demo123456", nome: "Dr. Fernando Gomes", cargo: "Juiz Relator" },
  { email: "juiz.adjunto@demo.tca.ao", password: "demo123456", nome: "Dra. Helena Matos", cargo: "Juiz Adjunto" },
  { email: "mp@demo.tca.ao", password: "demo123456", nome: "Dr. Jorge Pinto", cargo: "Ministério Público" },
  { email: "custas@demo.tca.ao", password: "demo123456", nome: "Isabel Tavares", cargo: "Técnico da Secção de Custas e Emolumentos" },
  { email: "diligencias@demo.tca.ao", password: "demo123456", nome: "Paulo Cardoso", cargo: "Oficial de Diligências" },
  { email: "presidente.camara@demo.tca.ao", password: "demo123456", nome: "Dr. Ricardo Sousa", cargo: "Presidente da Câmara" },
  { email: "presidente@demo.tca.ao", password: "demo123456", nome: "Cons. Alberto Nascimento", cargo: "Presidente do Tribunal de Contas" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const results: { email: string; status: string }[] = [];

  for (const user of DEMO_USERS) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { nome_completo: user.nome, cargo: user.cargo, divisao: user.divisao },
      });

      if (authError) {
        if (authError.message?.includes("already been registered")) {
          results.push({ email: user.email, status: "already exists" });
          continue;
        }
        results.push({ email: user.email, status: `auth error: ${authError.message}` });
        continue;
      }

      // Create profile
      const userId = authData.user!.id;
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: userId,
        nome_completo: user.nome,
        cargo: user.cargo,
        email: user.email,
        divisao: user.divisao || null,
      });

      if (profileError) {
        results.push({ email: user.email, status: `profile error: ${profileError.message}` });
        continue;
      }

      results.push({ email: user.email, status: "created" });
    } catch (e) {
      results.push({ email: user.email, status: `error: ${e.message}` });
    }
  }

  return new Response(JSON.stringify({ results }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BUCKET = process.env.SUPABASE_BUCKET || "arquivos-sistema";

async function uploadArquivo(pastaCaminho, arquivo) {
  const nomeUnico = `${Date.now()}-${arquivo.originalname}`;
  const caminhoCompleto = `${pastaCaminho}/${nomeUnico}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(caminhoCompleto, arquivo.buffer, {
      contentType: arquivo.mimetype,
    });

  if (error) throw new Error(`Falha no upload: ${error.message}`);

  return { nomeArquivo: arquivo.originalname, urlArquivo: caminhoCompleto };
}

async function gerarLinkDownload(caminhoArquivo, expiraEmSegundos = 300) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(caminhoArquivo, expiraEmSegundos);

  if (error) throw new Error(`Falha ao gerar link: ${error.message}`);
  return data.signedUrl;
}

async function excluirArquivo(caminhoArquivo) {
  const { error } = await supabase.storage.from(BUCKET).remove([caminhoArquivo]);
  if (error) throw new Error(`Falha ao excluir arquivo: ${error.message}`);
}

module.exports = { uploadArquivo, gerarLinkDownload, excluirArquivo };

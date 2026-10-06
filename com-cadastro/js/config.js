// Configuração do cadastro do responsável.
// ativo: true = pede o cadastro antes de usar; false = app abre direto (versão sem cadastro).
//   O comando "node tools/publicar.js" gera as duas versões prontas (dist/com-cadastro e dist/sem-cadastro).
// planilha: endereço do Apps Script publicado como "App da Web" (termina em /exec). Ver HOSPEDAGEM.md.
// token: o mesmo valor de TOKEN em tools/planilha/Codigo.gs (filtra envios que não vêm do app).
window.CADASTRO = {
  ativo: true,
  planilha: 'https://script.google.com/macros/s/AKfycbxsQtSM7xap613JDYri1K4_5odz_E6OHLe7FAqjPWsfUdTuUcJKsAaDVgmsBPDpdlw7/exec',
  token: 'ZBCRId4SlU_t'
};
// Aviso de privacidade: link para a política da Automec (se existir) e contato para pedidos sobre os dados.
window.PRIVACIDADE = {
  link: '',      // ex.: 'https://www.automec.com.br/privacidade'
  contato: ''    // ex.: 'privacidade@automec.com.br'
};

import React from 'react';

interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManualModal: React.FC<ManualModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h3 className="text-xl font-bold text-[#0033C6] mt-6 mb-2 border-b-2 border-gray-200 pb-1">{children}</h3>
  );

  const SubSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mt-3">
        <h4 className="font-bold text-gray-800">{title}</h4>
        <p className="text-sm text-gray-600">{children}</p>
    </div>
  );

  const WarningBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="p-3 my-2 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm">
        {children}
    </div>
  );

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-3xl m-4 transform transition-all duration-300 scale-100 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-[#0033C6]">📘 Manual do Usuário - AuditFlow Sampling</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-3xl">&times;</button>
        </div>
        <div className="overflow-y-auto pr-4 text-gray-700">
            <p>Este manual fornece orientações sobre cada etapa do processo de amostragem no AuditFlow.</p>
            
            <SectionTitle>Etapa 1: Parâmetros da Amostra</SectionTitle>
            <p>Nesta etapa, você define os critérios para o cálculo da amostra com base no seu <strong>julgamento profissional</strong>.</p>
            <SubSection title="Tamanho da população (N)">O número total de itens na base a ser auditada (ex: total de notas fiscais).</SubSection>
            <SubSection title="Nível de confiança (C)">Refere-se à sua confiança na <strong>integridade da base de dados</strong>. Uma base extraída de um ERP confiável (ex: SAP) merece uma confiança maior do que uma planilha preenchida manualmente.</SubSection>
            <SubSection title="Risco do processo (R)">Avaliação do risco inerente ao processo. Processos mais arriscados (ex: compras emergenciais) exigem uma amostra maior.</SubSection>
            <SubSection title="Maturidade dos controles (M)">Sua avaliação preliminar da qualidade dos controles internos do processo. Controles maduros e eficazes podem justificar uma amostra menor.</SubSection>
            <SubSection title="Erro tolerável (T)">O percentual máximo de erros que você aceitaria na amostra sem considerar a população inteira como problemática. </SubSection>
            <WarningBox><strong>Dica:</strong> Na dúvida sobre um parâmetro, seja sempre <strong>conservador</strong> (escolha o pior cenário), como um risco maior ou uma maturidade de controles menor. Isso fortalece a sua conclusão.</WarningBox>

            <SectionTitle>Etapa 1.5: Seleção de Itens a Target (Manual)</SectionTitle>
            <p>Itens a Target são selecionados manualmente por um motivo específico (ex: todas as transações acima de R$100.000). A quantidade destes itens será <strong>subtraída</strong> do cálculo da amostra estatística para evitar duplicidade.</p>
            
            <SectionTitle>Etapa 2: Upload da Base de Dados</SectionTitle>
            <p>Carregue o arquivo com a população completa.</p>
            <SubSection title="Formatos aceitos">.xlsx, .csv e .txt.</SubSection>
            <SubSection title="Validação de Linhas">O sistema verifica se o número de linhas de dados no arquivo corresponde ao <strong>Tamanho da População (N)</strong> informado na Etapa 1. Eles devem ser idênticos para prosseguir.</SubSection>
            <SubSection title="Fonte e Preparação dos Dados">Campo <strong>obrigatório e essencial</strong> para a rastreabilidade da auditoria. Descreva de onde os dados vieram, quem extraiu e quais filtros foram aplicados.</SubSection>

            <SectionTitle>Etapa 3: Tipo de Amostragem</SectionTitle>
            <p>Escolha o método estatístico para selecionar os itens.</p>
            <SubSection title="Seed">É um número inicial que garante a <strong>reprodutibilidade</strong> da amostra. Com o mesmo seed e os mesmos parâmetros, a amostra gerada será sempre a mesma.</SubSection>
            <SubSection title="Aleatória Simples">Todos os itens têm a mesma chance de serem selecionados. Ideal para populações homogêneas.</SubSection>
            <SubSection title="Sistemática">Seleciona um item inicial aleatoriamente e, a partir dele, seleciona itens em um intervalo fixo (ex: a cada 50 itens). <WarningBox>Cuidado com bases ordenadas por data ou valor, pois pode gerar viés.</WarningBox></SubSection>
            <SubSection title="Estratificada">Divide a população em subgrupos (estratos) com base em uma coluna (ex: por filial, por tipo de despesa) e seleciona uma amostra proporcional de cada grupo.</SubSection>
            <SubSection title="Unidade Monetária (MUS)">Ideal para testes financeiros. Itens de maior valor têm maior probabilidade de serem selecionados.</SubSection>

            <SectionTitle>Etapa 4: Resultado da Amostragem</SectionTitle>
            <p>Visualize, exporte e gerencie a amostra gerada.</p>
            <SubSection title="Exportação">Exporte a amostra para .CSV (simples) ou .XLSX. A exportação para XLSX inclui uma aba de <strong>Formalização</strong> com todos os parâmetros, justificativas e informações do processo, pronta para ser anexada como papel de trabalho.</SubSection>
            <SubSection title="Substituir Itens Duplicados">Se um item da amostra estatística gerada for o mesmo que um item que você já selecionou como Target, marque-o como duplicado e use esta função para substituí-lo por um novo item, garantindo a integridade do tamanho da amostra.</SubSection>

            <SectionTitle>Etapa 5: Teste e Registro dos Resultados</SectionTitle>
            <p>Após testar os itens da amostra inicial, registre os resultados aqui para avaliar a suficiência da amostra.</p>
            <SubSection title="Quantidade de erros">Insira o número de exceções/erros encontrados.</SubSection>
            <SubSection title="Avaliação Qualitativa (para bases não financeiras)">Se erros forem encontrados, classifique o impacto (baixo, médio, alto) e forneça uma justificativa detalhada.</SubSection>
            <SubSection title="Análise de Suficiência">Com base nos erros, o sistema determina se a amostra é <strong>suficiente</strong> ou se uma <strong>amostra complementar</strong> é necessária para concluir o teste com segurança.</SubSection>
            <SubSection title="Amostra Complementar">Se necessária, o sistema calculará o tamanho da amostra adicional. Você pode então gerá-la para continuar os testes.</SubSection>
        </div>
        <div className="mt-6 flex-shrink-0">
             <button 
                onClick={onClose}
                className="w-full px-6 py-3 bg-[#0033C6] text-white font-bold rounded-lg shadow-md hover:bg-blue-800 transition-all duration-300"
            >
                Fechar Manual
            </button>
        </div>
      </div>
    </div>
  );
};

export default ManualModal;

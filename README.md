# AuditFlow Sampling 🎯


O **AuditFlow Sampling** é uma aplicação web desenvolvida para auxiliar **auditorias internas** na definição e execução de amostragens de forma padronizada, transparente e reprodutível.  
Criado pela **R² Solutions Group – Tech & Consulting**, ele combina **metodologia de auditoria** com **tecnologia** para otimizar tempo e garantir consistência nos trabalhos.

---

## 🚀 Sobre a R² Solutions Group – Tech & Consulting
A **R² Solutions Group – Tech & Consulting** é especializada no desenvolvimento de soluções tecnológicas e consultoria estratégica. Nosso foco é **simplificar processos, aumentar produtividade** e oferecer **insights de qualidade** para a tomada de decisão.  
Mais do que tecnologia, entregamos **soluções com propósito**.

> **Slogan:** _"Mais do que tech. Soluções com propósito."_

---

## 📌 Funcionalidades do AuditFlow Sampling
- **Cálculo inteligente da amostra inicial** com base em:
  - Tamanho da população
  - Risco do processo
  - Maturidade dos controles
  - Confiança do auditor
  - Erro tolerável (%)
  - Base financeira ou não
- **Limite de amostra inicial:** 25 itens
- **Amostragem complementar automática** (máx. 15 itens), com lógica específica para bases financeiras e não financeiras
- **Classificação de impacto qualitativo** para exceções em bases não financeiras
- **Justificativa obrigatória** para classificação do impacto
- **Tipos de amostragem suportados**:
  - Aleatória simples
  - Sistemática
  - Estratificada
  - Unidade Monetária (MUS/UMS)
- **Seed reprodutível** para garantir que uma seleção possa ser refeita exatamente igual
- **Exportação para XLSX/CSV** com:
  - Parâmetros utilizados
  - Amostra inicial
  - Amostra complementar (quando houver)
  - Seed utilizado
  - Justificativa do auditor (quando aplicável)

---

## 🛠️ Tecnologias Utilizadas
- **React.js**
- **JavaScript (ES6+)**
- **xlsx** para exportação de dados
- **seedrandom** para amostragem reprodutível
- **CSS customizado** com paleta R² Solutions Group

---

## 📂 Estrutura do Projeto
```

AuditFlowSampling/
│── public/
│── src/
│   ├── components/
│   ├── pages/
│   ├── utils/
│── package.json
│── README.md

````

---

## 💻 Como rodar localmente
1. **Clone o repositório**
   ```bash
   git clone https://github.com/oRafaRosa/AuditFlowSampling.git
   cd AuditFlowSampling
````

2. **Instale as dependências**

   ```bash
   npm install
   ```

3. **Rode em modo desenvolvimento**

   ```bash
   npm start
   ```

4. **Build para produção**

   ```bash
   npm run build
   ```

---

## 🌐 Acessando a versão online

Após o deploy no **GitHub Pages**, o app ficará disponível em:
[https://oRafaRosa.github.io/AuditFlowSampling/](https://oRafaRosa.github.io/AuditFlowSampling/)

---

## 📄 Licença

Este projeto é de uso interno, propriedade da **R² Solutions Group – Tech & Consulting**. Não é permitido o uso comercial sem autorização expressa.

---

## 📞 Contato

📧 **E-mail:** [contato@r2solutionsgroup.com](mailto:contato@r2solutionsgroup.com)
🌐 **Site:** [www.r2solutionsgroup.com](https://www.r2solutionsgroup.com)
📍 São Paulo – SP, Brasil

```

---

Se quiser, eu já coloco um **banner bonito** no topo com o logo e as cores da tua empresa, pra deixar o GitHub com cara de projeto premium.  
Quer que eu já crie essa imagem e te mando pronta?
```

/*
 * AWS Cloud Quest — question bank
 * ===============================
 * To add a question: copy a { ... } block, paste it before the final "];",
 * edit the text and commit. Full guide: docs/ADDING_QUESTIONS.md
 *
 *   id          optional — stable identifier (derived from the text if missing)
 *   topic       optional — shown as a tag above the question
 *   q           required — question text (long scenarios are fine)
 *   options     required — 2 to 6 options (shuffled on every showing)
 *   answer      required — letter ("A"–"F") or 0-based index
 *   explanation optional — shown when a life is lost and on Game Over
 *   note        optional — maintainer note, never shown in the game
 *
 * Questions and answer keys are maintained by the repository owner for study
 * purposes. They are not official AWS exam questions.
 */
window.QUESTIONS = [
  {
    id: "s3-lifecycle-deep-archive",
    topic: "Armazenamento",
    q: "Uma empresa de mídia guarda vídeos brutos de gravações em um bucket do Amazon S3. Nos primeiros 30 dias, as equipes de edição acessam esses arquivos várias vezes por dia. Depois disso, os vídeos quase nunca são abertos, mas, por exigência contratual, precisam ser mantidos por 7 anos, e uma recuperação que leve até 12 horas é aceitável quando algum cliente pede um arquivo antigo. O diretor financeiro pediu para reduzir ao mínimo o custo de armazenamento, sem que a equipe precise mover arquivos manualmente e sem abrir mão da durabilidade dos dados. Qual abordagem atende a todos esses requisitos com o MENOR custo?",
    options: [
      "Manter todos os objetos no S3 Standard e ativar o versionamento do bucket para garantir a retenção de 7 anos.",
      "Criar uma regra de ciclo de vida do S3 que transfira os objetos para o S3 Glacier Deep Archive após 30 dias e os expire após 7 anos.",
      "Copiar os vídeos para volumes do Amazon EBS, criar snapshots mensais e apagar os objetos originais do bucket do S3.",
      "Mover os objetos para o S3 One Zone-IA após 30 dias, porque ela é a classe mais barata e mantém cópias em várias zonas de disponibilidade.",
      "Usar o S3 Intelligent-Tiering sem nenhuma configuração adicional, já que ele leva os objetos ao Glacier Deep Archive automaticamente.",
    ],
    answer: "B",
    explanation: "Regras de ciclo de vida movem e expiram objetos automaticamente. O S3 Glacier Deep Archive é a classe de menor custo do S3, tem a mesma durabilidade das demais e a recuperação padrão termina em até 12 horas. A One Zone-IA guarda os dados em uma única zona de disponibilidade, e as camadas de arquivamento do Intelligent-Tiering precisam ser ativadas explicitamente.",
  },
  {
    id: "lambda-serverless",
    topic: "Computação",
    q: "Qual serviço executa código em resposta a eventos sem que você provisione ou gerencie servidores, cobrando pelo número de requisições e pela duração da execução?",
    options: ["Amazon EC2", "AWS Lambda", "Amazon Lightsail", "Amazon EBS"],
    answer: 1,
    explanation: "O AWS Lambda é computação sem servidor: a AWS cuida da infraestrutura e você paga por requisições e pelo tempo de execução. EC2 e Lightsail exigem gerenciar instâncias, e o EBS é armazenamento em bloco.",
  },
  {
    id: "root-user-mfa",
    topic: "IAM e identidade",
    q: "Qual é a prática recomendada para o usuário-raiz (root) de uma conta da AWS?",
    options: [
      "Usá-lo nas tarefas do dia a dia, porque ele tem todas as permissões.",
      "Compartilhar a senha com a equipe de operações para emergências.",
      "Ativar a MFA e usá-lo apenas nas poucas tarefas que exigem o usuário-raiz.",
      "Criar chaves de acesso para ele e usá-las em scripts de automação.",
    ],
    answer: "C",
    explanation: "O usuário-raiz tem acesso irrestrito. A recomendação é protegê-lo com MFA, não criar chaves de acesso para ele e usar identidades do IAM (ou do IAM Identity Center) no dia a dia.",
  },
  {
    id: "shared-responsibility-ec2-os",
    topic: "Responsabilidade compartilhada",
    q: "Pelo modelo de responsabilidade compartilhada, quem aplica as atualizações de segurança do sistema operacional de uma instância do Amazon EC2?",
    options: [
      "A AWS, porque ela é dona do hardware.",
      "O cliente.",
      "A AWS ou o cliente, dependendo da região.",
      "O AWS Support, mediante abertura de chamado.",
    ],
    answer: "B",
    explanation: "No EC2 (infraestrutura como serviço), a AWS cuida da segurança DA nuvem (hardware, rede física, hipervisor) e o cliente cuida da segurança NA nuvem, o que inclui o sistema operacional convidado e seus patches.",
  },
  {
    id: "dynamodb-nosql",
    topic: "Banco de dados",
    q: "Qual banco de dados é NoSQL de chave-valor e documentos, totalmente gerenciado e sem servidor, com desempenho na casa de milissegundos de um dígito em qualquer escala?",
    options: ["Amazon RDS for MySQL", "Amazon DynamoDB", "Amazon Redshift", "Amazon Aurora"],
    answer: "B",
    explanation: "O Amazon DynamoDB é o banco NoSQL sem servidor da AWS. RDS e Aurora são bancos relacionais, e o Redshift é um data warehouse para análises.",
  },
  {
    id: "security-group-stateful",
    topic: "Redes e VPC",
    q: "Qual afirmação sobre os security groups de uma VPC está correta?",
    options: [
      "Atuam no nível da sub-rede.",
      "São stateful: a resposta a uma conexão permitida é liberada automaticamente.",
      "Aceitam regras de negação explícita (deny).",
      "Avaliam as regras em ordem numérica, da menor para a maior.",
    ],
    answer: 1,
    explanation: "Security groups atuam na interface de rede da instância, só têm regras de permissão e são stateful. Atuar na sub-rede, aceitar deny e avaliar regras em ordem numérica são características das network ACLs, que são stateless.",
  },
  {
    id: "cloudtrail-api-audit",
    topic: "Governança e auditoria",
    q: "Uma auditoria precisa saber qual usuário apagou um bucket do S3, quando e de qual endereço IP. Qual serviço registra essas chamadas de API na conta?",
    options: ["Amazon CloudWatch", "AWS CloudTrail", "AWS Config", "Amazon Inspector"],
    answer: "B",
    explanation: "O AWS CloudTrail registra as ações feitas na conta (quem, quando, de onde e com quais parâmetros). O CloudWatch cuida de métricas e logs de aplicações, o Config registra o estado da configuração dos recursos, e o Inspector procura vulnerabilidades.",
  },
  {
    id: "spot-batch-cost",
    topic: "Preços e compras",
    q: "Um processamento em lote é tolerante a falhas, pode ser interrompido e retomado a qualquer momento e não tem previsão de uso contínuo. Qual opção de compra do EC2 costuma ter o MENOR custo para esse caso?",
    options: ["Instâncias sob demanda", "Instâncias reservadas", "Instâncias spot", "Hosts dedicados"],
    answer: "C",
    explanation: "Instâncias spot usam capacidade ociosa com grandes descontos sobre o preço sob demanda, mas podem ser interrompidas pela AWS, o que é aceitável para cargas tolerantes a falhas. Instâncias reservadas exigem compromisso de uso, e hosts dedicados são a opção mais cara.",
  },
  {
    "id": "clf-sim01-03",
    "topic": "Governança e auditoria",
    "q": "Qual serviço da AWS pode identificar quando uma instância Amazon EC2 foi encerrada?",
    "options": [
      "AWS CloudTrail",
      "Amazon EventBridge",
      "Gerenciamento de Identidade e Acesso da AWS (IAM)",
      "AWS Compute Optimizer"
    ],
    "answer": "A",
    "explanation": "O CloudTrail registra quem fez o quê e quando (chamadas de API, como TerminateInstances). O EventBridge reage a eventos, mas não guarda histórico de auditoria."
  },
  {
    "id": "clf-sim01-04",
    "topic": "Banco de dados",
    "q": "Uma empresa tem um banco de dados MySQL rodando em uma única instância Amazon EC2. A empresa agora requer maior disponibilidade em caso de interrupção. Qual conjunto de tarefas atenderia a esse requisito?",
    "options": [
      "Configurar a Recuperação Automática do EC2 para mover a instância para outra Zona de Disponibilidade",
      "Adicionar um Balanceador de Carga de Aplicativos na frente da instância EC2",
      "Migrar para Amazon RDS e habilitar Multi-AZ",
      "Habilitar proteção contra encerramento para a instância EC2 para evitar interrupções"
    ],
    "answer": "C",
    "explanation": "O Multi-AZ do RDS mantém uma réplica standby em outra AZ com failover automático. O ALB distribui tráfego web e a proteção contra encerramento só evita deleção acidental."
  },
  {
    "id": "clf-sim01-05",
    "topic": "Responsabilidade compartilhada",
    "q": "Qual opção é uma responsabilidade do cliente sob o modelo de responsabilidade compartilhada da AWS?",
    "options": [
      "Manutenção de componentes da VPC",
      "Manutenção do hardware subjacente das instâncias Amazon EC2",
      "Segurança de dados da aplicação",
      "Segurança física dos data centers"
    ],
    "answer": "C",
    "explanation": "A AWS cuida da segurança DA nuvem (hardware, data centers, infraestrutura). O cliente cuida da segurança NA nuvem (seus dados, configurações, acessos)."
  },
  {
    "id": "clf-sim01-06",
    "topic": "Redes e VPC",
    "q": "Qual serviço ou recurso da AWS uma empresa pode usar para aplicar regras de segurança a instâncias específicas do Amazon EC2?",
    "options": [
      "Listas de Controle de Acesso de Rede (ACLs)",
      "Grupos de Segurança",
      "AWS WAF",
      "AWS Trusted Advisor"
    ],
    "answer": "B",
    "explanation": "O Security Group atua na instância (firewall com estado, só regras de permissão). A Network ACL atua na sub-rede, sem estado, e aceita permitir e negar."
  },
  {
    "id": "clf-sim01-07",
    "topic": "Governança e auditoria",
    "q": "Uma empresa deseja lançar várias cargas de trabalho na AWS. Cada carga de trabalho está relacionada a uma unidade de negócios diferente. A empresa deseja separar e rastrear os custos de cada unidade de negócios. Qual solução atenderá a esses requisitos com o menor overhead operacional?",
    "options": [
      "Usar o console de faturamento da AWS para atribuir proprietários a recursos e rastrear custos",
      "Usar uma tabela Amazon DynamoDB para registrar os custos de cada unidade de negócios",
      "Usar uma planilha para controlar os proprietários e o custo de cada recurso",
      "Usar AWS Organizations e criar uma conta para cada unidade de negócios"
    ],
    "answer": "D",
    "explanation": "Uma conta por unidade de negócios dentro do AWS Organizations separa e rastreia custos naturalmente, com faturamento consolidado e pouco trabalho manual."
  },
  {
    "id": "clf-sim01-09",
    "topic": "Análise de dados",
    "q": "Uma empresa tem 5 TB de dados armazenados no Amazon S3. A empresa planeja ocasionalmente executar consultas nos dados para análise. Qual serviço da AWS a empresa deve usar para executar essas consultas da maneira mais econômica?",
    "options": [
      "Amazon Kinesis",
      "Amazon Athena",
      "Amazon Redshift",
      "Amazon RDS"
    ],
    "answer": "B",
    "explanation": "O Athena é serverless e consulta direto no S3 com SQL, pagando só por consulta. Para uso ocasional sai mais barato que manter um cluster Redshift ligado."
  },
  {
    "id": "clf-sim01-10",
    "topic": "Migração e CAF",
    "q": "Qual opção é uma perspectiva que inclui capacidades fundamentais do AWS Cloud Adoption Framework (AWS CAF)?",
    "options": [
      "Confiabilidade",
      "Sustentabilidade",
      "Operações",
      "Eficiência de Desempenho"
    ],
    "answer": "C",
    "explanation": "As 6 perspectivas do CAF: Negócios, Pessoas, Governança, Plataforma, Segurança e Operações. Confiabilidade, Sustentabilidade e Eficiência de Desempenho são pilares do Well-Architected Framework."
  },
  {
    "id": "clf-sim01-13",
    "topic": "Gestão de custos",
    "q": "Uma empresa está executando uma carga de trabalho na AWS Cloud. Qual prática recomendada da AWS garante a arquitetura mais econômica para a carga de trabalho?",
    "options": [
      "Acoplamento Fraco",
      "Redundância",
      "Cache",
      "Dimensionamento Correto"
    ],
    "answer": "D",
    "explanation": "Dimensionamento correto (right-sizing) ajusta o tamanho dos recursos à demanda real, sem pagar por capacidade ociosa."
  },
  {
    "id": "clf-sim01-14",
    "topic": "Suporte e parceiros",
    "q": "Uma empresa precisa contratar consultores terceirizados para ajudar a manter e apoiar seu ambiente da AWS e as necessidades de negócios da empresa. Qual serviço ou recurso da AWS atenderá a esses requisitos?",
    "options": [
      "Suporte da AWS",
      "AWS Organizations",
      "AWS Service Catalog",
      "AWS Partner Network (APN)"
    ],
    "answer": "D",
    "explanation": "A APN é a rede de parceiros e consultorias certificadas pela AWS. O AWS Support é o suporte técnico da própria AWS, não consultores externos."
  },
  {
    "id": "clf-sim01-15",
    "topic": "Proteção de dados",
    "q": "Qual serviço da AWS fornece criptografia em repouso para volumes Amazon RDS e Amazon Elastic Block Store (Amazon EBS)?",
    "options": [
      "AWS Key Management Service (AWS KMS)",
      "AWS Lambda",
      "Amazon Rekognition",
      "AWS WAF"
    ],
    "answer": "A",
    "explanation": "O KMS cria e gerencia as chaves de criptografia usadas por RDS, EBS, S3 e outros. O WAF protege aplicações web contra ataques."
  },
  {
    "id": "clf-sim01-17",
    "topic": "Migração e CAF",
    "q": "Qual perspectiva do AWS Cloud Adoption Framework (AWS CAF) inclui uma capacidade para arquitetura de dados e análises bem projetada?",
    "options": [
      "Segurança",
      "Plataforma",
      "Operações",
      "Governança"
    ],
    "answer": "B",
    "explanation": "A perspectiva Plataforma cobre capacidades técnicas de infraestrutura e aplicações: arquitetura de dados, engenharia de dados, CI/CD e arquitetura de plataforma."
  },
  {
    "id": "clf-sim01-19",
    "topic": "Well-Architected",
    "q": "Uma empresa migrou suas cargas de trabalho para a AWS. A empresa quer adotar a AWS em escala e operar de forma mais eficiente e segura. Qual serviço ou framework da AWS a empresa deve usar para suporte operacional?",
    "options": [
      "AWS Cloud Adoption Framework (AWS CAF)",
      "Suporte da AWS",
      "AWS Managed Services (AMS)",
      "AWS Well-Architected Framework"
    ],
    "answer": "D",
    "explanation": "O Well-Architected Framework traz as boas práticas (6 pilares, incluindo Excelência Operacional e Segurança) para operar com eficiência e segurança. O CAF é para planejar a adoção; o AMS é um serviço pago em que a AWS opera o ambiente.",
    "note": "Gabarito discutível: o AMS também faz sentido para 'suporte operacional'. Registrado o gabarito mostrado pelo simulado."
  },
  {
    "id": "clf-sim01-20",
    "topic": "Well-Architected",
    "q": "Uma empresa está lançando um aplicativo móvel. A empresa quer que os clientes possam usar o aplicativo sem atualizar seus dispositivos móveis. Qual pilar do AWS Well-Architected Framework representa esse objetivo?",
    "options": [
      "Sustentabilidade",
      "Confiabilidade",
      "Otimização de custos",
      "Segurança"
    ],
    "answer": "C",
    "explanation": "Gabarito conforme o simulado: Otimização de custos.",
    "note": "Gabarito estranho: a lógica do enunciado não aponta claramente para Otimização de custos. Registrado exatamente como o simulado mostrou."
  },
  {
    "id": "clf-sim01-21",
    "topic": "Infraestrutura global",
    "q": "A sede de uma empresa está localizada em um continente diferente de onde a maioria dos clientes da empresa vive. A empresa deseja configurar um ambiente na AWS Cloud que forneça a menor latência para os clientes. Qual serviço da AWS fornece essa funcionalidade?",
    "options": [
      "EC2 Image Builder",
      "AWS Organizations",
      "Catálogo de Serviços da AWS",
      "AWS Systems Manager"
    ],
    "answer": "B",
    "explanation": "Gabarito conforme o simulado: AWS Organizations.",
    "note": "Gabarito estranho: o Organizations gerencia várias contas, não reduz latência (o esperado seria escolher a Região mais próxima, CloudFront ou Global Accelerator). Registrado como o simulado mostrou."
  },
  {
    "id": "clf-sim01-22",
    "topic": "IAM e identidade",
    "q": "Uma empresa deseja uma lista de todos os usuários em sua conta da AWS, o status de todas as chaves de acesso dos usuários e se a autenticação multifator (MFA) foi configurada. Qual serviço ou recurso da AWS atenderá a esses requisitos?",
    "options": [
      "Amazon CloudWatch",
      "Relatório de credenciais do IAM",
      "IAM Access Analyzer",
      "Serviço de Gerenciamento de Chaves da AWS (AWS KMS)"
    ],
    "answer": "B",
    "explanation": "O relatório de credenciais do IAM é um CSV com todos os usuários e o estado de senhas, chaves de acesso e MFA. O Access Analyzer identifica recursos compartilhados com entidades externas."
  },
  {
    "id": "clf-sim01-23",
    "topic": "Computação",
    "q": "Qual serviço da AWS deve ser usado quando uma empresa precisa fornecer desktops virtuais para seus funcionários remotos?",
    "options": [
      "Gerenciamento de Identidade e Acesso da Amazon (IAM)",
      "AWS Directory Service",
      "Amazon WorkSpaces",
      "Centro de Identidade da AWS (AWS Single Sign-On)"
    ],
    "answer": "C",
    "explanation": "O WorkSpaces é desktop como serviço (DaaS), com desktops Windows ou Linux na nuvem. Os outros tratam de identidade e acesso."
  },
  {
    "id": "clf-sim01-24",
    "topic": "Migração e CAF",
    "q": "Uma empresa deseja monitorar o desempenho de sua carga de trabalho. A empresa quer garantir que os serviços em nuvem sejam entregues em um nível que atenda às suas necessidades de negócios. Qual perspectiva do AWS Cloud Adoption Framework (AWS CAF) atenderá a esses requisitos?",
    "options": [
      "Operações",
      "Negócios",
      "Governança",
      "Plataforma"
    ],
    "answer": "A",
    "explanation": "Operações cobre monitoramento, gestão de incidentes e garantia de que os serviços rodam no nível esperado pelo negócio."
  },
  {
    "id": "clf-sim01-25",
    "topic": "IAM e identidade",
    "q": "Uma empresa quer verificar se a autenticação multifator (MFA) está habilitada para todos os usuários dentro de suas contas da AWS. Qual serviço ou recurso da AWS atenderá a esse requisito?",
    "options": [
      "Relatórios do Amazon CloudFront",
      "Relatórios de Credenciais do IAM",
      "Relatório de Custos e Uso da AWS",
      "AWS Artifact"
    ],
    "answer": "B",
    "explanation": "O relatório de credenciais do IAM mostra, por usuário, se o MFA está ativo. O Cost and Usage Report trata de custos e o AWS Artifact entrega relatórios de conformidade da AWS."
  },
  {
    "id": "clf-sim01-26",
    "topic": "Infraestrutura global",
    "q": "Uma empresa deseja que suas instâncias Amazon EC2 compartilhem a mesma área geográfica, mas usem múltiplas fontes de energia subjacentes independentes. Qual solução atinge esse objetivo?",
    "options": [
      "Usar instâncias EC2 em uma única Zona de Disponibilidade",
      "Usar instâncias EC2 em várias regiões da AWS",
      "Usar instâncias EC2 em várias Zonas de Disponibilidade na mesma região da AWS",
      "Usar instâncias EC2 na mesma localização de borda e na mesma região da AWS"
    ],
    "answer": "C",
    "explanation": "Cada AZ tem energia, rede e refrigeração independentes, e as AZs de uma região ficam próximas o bastante para baixa latência."
  },
  {
    "id": "clf-sim01-27",
    "topic": "Computação",
    "q": "Qual serviço da AWS usa o AWS Compute Optimizer para fornecer recomendações de dimensionamento com base em métricas de carga de trabalho?",
    "options": [
      "Amazon Lightsail",
      "Amazon RDS",
      "Amazon EC2",
      "AWS Step Functions"
    ],
    "answer": "C",
    "explanation": "O Compute Optimizer analisa o uso real (CPU, memória, rede) e recomenda o tamanho ideal de recursos como instâncias EC2, Auto Scaling groups, volumes EBS e funções Lambda."
  },
  {
    "id": "clf-sim01-28",
    "topic": "Proteção de dados",
    "q": "Uma empresa deseja definir uma política central de proteção de dados que funcione em todos os serviços da AWS para recursos de computação, armazenamento e banco de dados. Qual serviço da AWS atenderá a esse requisito?",
    "options": [
      "AWS Elastic Disaster Recovery",
      "AWS Batch",
      "AWS Backup",
      "Amazon FSx"
    ],
    "answer": "C",
    "explanation": "O AWS Backup centraliza e automatiza backups de vários serviços (EC2, EBS, RDS, DynamoDB, EFS, S3 e outros) com uma política única."
  },
  {
    "id": "clf-sim01-29",
    "topic": "Migração e CAF",
    "q": "Uma empresa deseja um serviço da AWS para coletar e processar 10 TB de dados localmente e transferir os dados para a AWS. A empresa tem conectividade intermitente. Qual serviço da AWS atenderá a esses requisitos?",
    "options": [
      "Serviço de Migração de Banco de Dados da AWS (AWS DMS)",
      "AWS Snowball Edge",
      "AWS Backup",
      "AWS DataSync"
    ],
    "answer": "B",
    "explanation": "O Snowball Edge é um dispositivo físico que processa dados localmente (edge computing) e depois é enviado à AWS, ideal para grandes volumes e conexão ruim. O DataSync depende de rede estável."
  },
  {
    "id": "clf-sim01-30",
    "topic": "Infraestrutura global",
    "q": "Uma empresa deseja usar a AWS Cloud para implantar uma aplicação globalmente. Qual modelo de implantação de arquitetura a empresa deve usar para atender a esse requisito?",
    "options": [
      "Multi-Região",
      "Single-AZ",
      "Single-Region",
      "Multi-AZ"
    ],
    "answer": "A",
    "explanation": "Para atender usuários no mundo todo (menor latência e resiliência a falhas regionais) a aplicação precisa estar em várias Regiões. Multi-AZ continua dentro de uma região."
  },
  {
    "id": "clf-sim01-31",
    "topic": "Migração e CAF",
    "q": "Qual serviço da AWS fornece um único local para rastrear o progresso das migrações de aplicativos?",
    "options": [
      "AWS Service Catalog",
      "AWS Application Migration Service",
      "AWS Migration Hub",
      "Serviço de Descoberta de Aplicações da AWS"
    ],
    "answer": "C",
    "explanation": "O Migration Hub é o painel central para acompanhar migrações. O Application Migration Service executa a migração de servidores e o Application Discovery Service coleta dados dos servidores locais antes da migração."
  },
  {
    "id": "clf-sim01-32",
    "topic": "Detecção de ameaças e vulnerabilidades",
    "q": "Uma empresa precisa de um serviço de gerenciamento de vulnerabilidades automatizado que escaneie continuamente as cargas de trabalho da AWS em busca de vulnerabilidades de software. Qual serviço da AWS atenderá a esses requisitos?",
    "options": [
      "AWS Security Hub",
      "AWS Shield",
      "Amazon GuardDuty",
      "Amazon Inspector"
    ],
    "answer": "D",
    "explanation": "O Inspector escaneia automaticamente EC2, imagens de contêiner e funções Lambda atrás de vulnerabilidades. O GuardDuty detecta ameaças, o Shield protege contra DDoS e o Security Hub consolida alertas."
  },
  {
    "id": "clf-sim01-33",
    "topic": "Detecção de ameaças e vulnerabilidades",
    "q": "Uma empresa deseja um processo automatizado para escanear continuamente suas instâncias Amazon EC2 em busca de vulnerabilidades de software. Qual serviço da AWS atenderá a esses requisitos?",
    "options": [
      "Amazon GuardDuty",
      "Amazon Cognito",
      "Amazon Detective",
      "Amazon Inspector"
    ],
    "answer": "D",
    "explanation": "O Detective investiga a causa de incidentes já detectados e o Cognito autentica usuários de apps. Só o Inspector faz varredura contínua de vulnerabilidades."
  },
  {
    "id": "clf-sim01-34",
    "topic": "Armazenamento",
    "q": "Qual serviço da AWS oferece armazenamento de objetos?",
    "options": [
      "Amazon DynamoDB",
      "Amazon RDS",
      "Amazon S3",
      "Amazon Elastic File System (Amazon EFS)"
    ],
    "answer": "C",
    "explanation": "S3 = objetos, EBS = blocos, EFS = arquivos (sistema de arquivos compartilhado). RDS é banco relacional e DynamoDB é NoSQL."
  },
  {
    "id": "clf-sim01-36",
    "topic": "Suporte e parceiros",
    "q": "Uma empresa está avaliando seu plano de Suporte Empresarial da AWS para determinar se o plano ainda atende às necessidades da empresa. A empresa está considerando mudar para o AWS Enterprise Support. Qual benefício adicional a empresa receberá com o AWS Enterprise Support?",
    "options": [
      "Uma revisão consultiva e orientação de arquitetura para as aplicações da empresa",
      "Um conjunto completo de verificações do AWS Trusted Advisor",
      "Um gerente de conta técnica designado (TAM) para auxiliar no monitoramento e otimização",
      "Acesso por telefone, e-mail e chat aos engenheiros de suporte em nuvem 24 horas por dia, 7 dias por semana"
    ],
    "answer": "C",
    "explanation": "O TAM é o benefício exclusivo do Enterprise. O conjunto completo do Trusted Advisor e o suporte 24/7 já vêm desde o plano Business."
  },
  {
    "id": "clf-sim01-37",
    "topic": "IAM e identidade",
    "q": "Uma empresa precisa configurar a autenticação de usuários para um novo aplicativo. Os usuários devem poder fazer login diretamente com um nome de usuário e senha, ou através de um provedor de terceiros. Qual serviço da AWS a empresa deve usar para atender a esses requisitos?",
    "options": [
      "Centro de Identidade AWS (AWS Single Sign-On)",
      "AWS Directory Service",
      "AWS Signer",
      "Amazon Cognito"
    ],
    "answer": "D",
    "explanation": "O Cognito cuida de cadastro e login de usuários de aplicativos, com login direto ou federado (Google, Facebook, SAML). O Identity Center é para acesso de funcionários às contas AWS e o Signer assina código."
  },
  {
    "id": "clf-sim01-38",
    "topic": "Infraestrutura global",
    "q": "Uma empresa deseja projetar um aplicativo web confiável hospedado no Amazon EC2. Qual abordagem alcançará esse objetivo?",
    "options": [
      "Distribuir instâncias EC2 por mais de um grupo de segurança",
      "Lançar grandes instâncias EC2 na mesma Zona de Disponibilidade",
      "Usar uma Amazon Machine Image (AMI) do AWS Marketplace",
      "Distribuir instâncias EC2 por mais de uma Zona de Disponibilidade"
    ],
    "answer": "D",
    "explanation": "Confiabilidade vem de eliminar pontos únicos de falha: espalhar instâncias por várias AZs mantém o app no ar se um data center cair."
  },
  {
    "id": "clf-sim01-40",
    "topic": "Proteção de dados",
    "q": "Um desenvolvedor deseja usar um bucket do Amazon S3 para armazenar logs de aplicativos que contêm dados sensíveis. Qual serviço ou recurso da AWS o desenvolvedor deve usar para restringir o acesso de leitura e escrita ao bucket S3?",
    "options": [
      "AWS CloudTrail",
      "Amazon CloudWatch",
      "Grupos de Segurança",
      "ACLs"
    ],
    "answer": "D",
    "explanation": "As ACLs de bucket do S3 controlam quem lê e escreve. CloudTrail e CloudWatch só registram/monitoram, e Grupos de Segurança protegem instâncias.",
    "note": "Hoje a AWS recomenda bucket policies e IAM em vez de ACLs, mas entre as opções dadas só ela controla acesso ao bucket. Registrado o gabarito do simulado."
  },
  {
    "id": "clf-sim01-42",
    "topic": "Gestão de custos",
    "q": "Uma empresa precisa categorizar e rastrear os custos de uso da AWS com base em categorias de negócios. Qual serviço ou recurso da AWS a empresa deve usar para atender a esses requisitos?",
    "options": [
      "Tags de Alocação de Custos",
      "AWS Organizations",
      "AWS Security Hub",
      "Relatório de Custos e Uso da AWS"
    ],
    "answer": "A",
    "explanation": "Tags de alocação de custos rotulam recursos (ex.: Projeto=X) e agrupam os custos por essas categorias no Cost Explorer e no CUR. O Organizations separa custos por conta, não por categoria."
  },
  {
    "id": "clf-sim01-44",
    "topic": "Responsabilidade compartilhada",
    "q": "Qual serviço da AWS exige que o cliente seja totalmente responsável pela aplicação de patches no sistema operacional?",
    "options": [
      "Amazon DynamoDB",
      "AWS Fargate",
      "Amazon EC2",
      "AWS Lambda"
    ],
    "answer": "C",
    "explanation": "No EC2 você gerencia o sistema operacional (patches, atualizações). DynamoDB, Fargate e Lambda são gerenciados/serverless e a AWS cuida do SO."
  },
  {
    "id": "clf-sim01-45",
    "topic": "IAM e identidade",
    "q": "Qual tarefa só pode ser realizada pelo usuário root da conta AWS?",
    "options": [
      "Exclusão de recursos da AWS",
      "Criando um par de chaves do Amazon EC2",
      "Configurando AWS WAF",
      "Mudança do plano de Suporte da AWS"
    ],
    "answer": "D",
    "explanation": "Tarefas exclusivas do root: alterar o plano de Suporte, fechar a conta, mudar configurações da conta e ver certos dados de faturamento. As demais, qualquer usuário IAM com permissão faz."
  },
  {
    "id": "clf-sim01-46",
    "topic": "Migração e CAF",
    "q": "Uma empresa planeja migrar para a AWS Cloud. A empresa deseja usar o AWS Cloud Adoption Framework (AWS CAF) para definir e rastrear os resultados de negócios como parte de sua jornada de transformação em nuvem. Qual capacidade da perspectiva de governança do AWS CAF atenderá a esses requisitos?",
    "options": [
      "Gerenciamento de portfólio de aplicações",
      "Gerenciamento de Riscos",
      "Gerenciamento de Benefícios",
      "Gerenciamento financeiro em nuvem"
    ],
    "answer": "C",
    "explanation": "Na perspectiva Governança, o Gerenciamento de Benefícios define e acompanha os resultados de negócio da adoção da nuvem. Riscos cuida de mitigação e o financeiro trata de custos."
  },
  {
    "id": "clf-sim01-47",
    "topic": "Armazenamento",
    "q": "Qual classe de armazenamento do Amazon S3 é a mais econômica para armazenamento de longo prazo?",
    "options": [
      "S3 One Zone-Infrequent Access (S3 One Zone-IA)",
      "S3 Standard",
      "S3 Standard-Infrequent Access (S3 Standard-IA)",
      "S3 Glacier Deep Archive"
    ],
    "answer": "D",
    "explanation": "O Glacier Deep Archive é a classe mais barata do S3, para arquivamento de longo prazo (acesso raro, recuperação em horas)."
  },
  {
    "id": "clf-sim01-48",
    "topic": "Well-Architected",
    "q": "Qual serviço ou ferramenta da AWS ajuda as empresas a medir o impacto ambiental do uso da AWS?",
    "options": [
      "Ferramenta de pegada de carbono do cliente da AWS",
      "Pilar de Sustentabilidade",
      "OS-Climate (Open Source Climate Data Commons)",
      "AWS Compute Optimizer"
    ],
    "answer": "A",
    "explanation": "A Customer Carbon Footprint Tool mostra as emissões de carbono do seu uso da AWS. O pilar de Sustentabilidade é uma diretriz do Well-Architected, não uma ferramenta de medição."
  },
  {
    "id": "clf-sim01-49",
    "topic": "Responsabilidade compartilhada",
    "q": "Uma empresa deseja migrar um banco de dados de um ambiente local para o Amazon RDS. Após a migração estar completa, por qual tarefa de gerenciamento a empresa ainda será responsável?",
    "options": [
      "Gerenciamento do Ciclo de Vida do Hardware",
      "Otimização de Aplicações",
      "Manutenção de servidores",
      "Provisionamento de energia, rede e resfriamento"
    ],
    "answer": "B",
    "explanation": "No RDS a AWS cuida de hardware, servidores, SO, patches do banco, energia, rede e resfriamento. Ao cliente sobram schema, consultas, índices e otimização da aplicação."
  },
  {
    "id": "clf-sim01-50",
    "topic": "Migração e CAF",
    "q": "Uma empresa está movendo um data center local para a AWS Cloud. A empresa deve migrar 50 petabytes de dados de armazenamento de arquivos para a AWS com o menor possível overhead operacional. Qual serviço ou recurso da AWS a empresa deve usar para atender a esses requisitos?",
    "options": [
      "AWS Snowmobile",
      "AWS Snowball Edge",
      "AWS Data Exchange",
      "AWS Database Migration Service (AWS DMS)"
    ],
    "answer": "A",
    "explanation": "O Snowmobile é um contêiner puxado por caminhão para escala de exabytes. O Snowball Edge comporta dezenas de TB por dispositivo, então 50 PB exigiriam centenas deles."
  },
  {
    "id": "clf-sim01-51",
    "topic": "Computação",
    "q": "Uma empresa precisa implantar aplicativos na AWS Cloud o mais rápido possível. A empresa também precisa minimizar a complexidade relacionada ao gerenciamento de recursos da AWS. Qual serviço da AWS a empresa deve usar para atender a esses requisitos?",
    "options": [
      "AWS Config",
      "Amazon Personalize",
      "Amazon EC2",
      "AWS Elastic Beanstalk"
    ],
    "answer": "D",
    "explanation": "O Elastic Beanstalk é um PaaS: você envia o código e ele provisiona e gerencia EC2, balanceador, Auto Scaling e monitoramento."
  },
  {
    "id": "clf-sim01-52",
    "topic": "IAM e identidade",
    "q": "Uma empresa está construindo uma aplicação na AWS Cloud. A empresa quer usar credenciais temporárias para a aplicação acessar outros recursos da AWS. Qual serviço da AWS atenderá a esses requisitos?",
    "options": [
      "AWS CloudHSM",
      "AWS Security Token Service (AWS STS)",
      "Amazon Cognito",
      "Serviço de Gerenciamento de Chaves da AWS (AWS KMS)"
    ],
    "answer": "B",
    "explanation": "O STS emite credenciais temporárias de acesso (usadas, por exemplo, em IAM roles). CloudHSM e KMS cuidam de chaves de criptografia e o Cognito autentica usuários finais."
  },
  {
    "id": "clf-sim01-53",
    "topic": "Benefícios da nuvem",
    "q": "Qual benefício da AWS Cloud descreve a capacidade de adquirir recursos conforme necessário e liberar recursos quando não são mais necessários?",
    "options": [
      "Agilidade",
      "Segurança",
      "Elasticidade",
      "Economias de Escala"
    ],
    "answer": "C",
    "explanation": "Elasticidade é aumentar e diminuir recursos conforme a demanda. Agilidade é a rapidez para provisionar e experimentar; economias de escala é o preço menor por unidade graças ao volume da AWS."
  },
  {
    "id": "clf-sim01-55",
    "topic": "Computação",
    "q": "A aplicação de uma empresa tem alto uso de clientes durante certos horários do dia. A empresa quer reduzir o número de instâncias Amazon EC2 que estão em execução quando o uso da aplicação é baixo. Qual serviço ou opção de compra de instância da AWS a empresa deve usar para atender a esse requisito?",
    "options": [
      "Instâncias Reservadas",
      "Planos de Economia para Instâncias EC2",
      "Instâncias Spot",
      "Amazon EC2 Auto Scaling"
    ],
    "answer": "D",
    "explanation": "O EC2 Auto Scaling adiciona e remove instâncias automaticamente conforme a demanda. Reservadas, Savings Plans e Spot são opções de preço e não alteram a quantidade de instâncias."
  },
  {
    "id": "clf-sim01-57",
    "topic": "Banco de dados",
    "q": "Uma empresa deseja um serviço de banco de dados de séries temporais que facilite o armazenamento e a análise de trilhões de eventos a cada dia. Qual serviço da AWS atenderá a esse requisito?",
    "options": [
      "Amazon DocumentDB (com compatibilidade com MongoDB)",
      "Amazon Forecast",
      "Amazon Neptune",
      "Amazon Timestream"
    ],
    "answer": "D",
    "explanation": "O Timestream é o banco serverless da AWS para séries temporais (IoT, métricas, eventos). O Forecast é previsão com ML, o Neptune é banco de grafos e o DocumentDB é banco de documentos."
  },
  {
    "id": "clf-sim01-58",
    "topic": "Banco de dados",
    "q": "Uma empresa precisa de um serviço de banco de dados gráfico que seja escalável e altamente disponível. Qual serviço da AWS atende a esses requisitos?",
    "options": [
      "Amazon Aurora",
      "Amazon DynamoDB",
      "Amazon Neptune",
      "Amazon Redshift"
    ],
    "answer": "C",
    "explanation": "O Neptune é o banco de grafos gerenciado da AWS (redes sociais, detecção de fraude). Aurora é relacional, DynamoDB é NoSQL chave-valor e Redshift é data warehouse."
  },
  {
    "id": "clf-sim01-60",
    "topic": "Análise de dados",
    "q": "Uma empresa está considerando a migração para a AWS Cloud. A empresa quer um serviço ou recurso totalmente gerenciado que possa transferir dados de streaming de várias fontes para um bucket do Amazon S3. Qual serviço ou recurso da AWS a empresa deve usar para atender a esses requisitos?",
    "options": [
      "Amazon Kinesis Data Firehose",
      "AWS Transfer Family",
      "AWS DataSync",
      "S3 Select"
    ],
    "answer": "A",
    "explanation": "O Kinesis Data Firehose captura dados de streaming e entrega em destinos como S3, Redshift e OpenSearch, sem servidores para gerenciar. O Transfer Family usa SFTP/FTP, o DataSync copia dados entre local e AWS e o S3 Select só consulta dados já no S3."
  },
  {
    "id": "clf-sim01-61",
    "topic": "Proteção de dados",
    "q": "Uma empresa hospeda uma grande quantidade de dados na AWS. A empresa deseja identificar se algum desses dados deve ser considerado sensível. Qual serviço da AWS atenderá a esse requisito?",
    "options": [
      "Amazon CloudWatch",
      "Gerenciamento de Identidade e Acesso da AWS (IAM)",
      "Amazon Macie",
      "Amazon Inspector"
    ],
    "answer": "C",
    "explanation": "O Macie usa machine learning para descobrir e classificar dados sensíveis (dados pessoais, credenciais) no S3. O Inspector procura vulnerabilidades de software."
  },
  {
    "id": "clf-sim01-62",
    "topic": "Suporte e parceiros",
    "q": "Como a equipe de Concierge do AWS Enterprise Support ajuda os usuários?",
    "options": [
      "Suporte ao Desenvolvimento de Aplicações",
      "Fornecimento de orientação de arquitetura",
      "Respondendo a consultas de faturamento e contas",
      "Respondendo perguntas sobre casos de suporte técnico"
    ],
    "answer": "C",
    "explanation": "A Concierge Support Team é focada em faturamento e gerenciamento de conta. Questões técnicas vão para os engenheiros de suporte e orientação de arquitetura vem do TAM e dos Solutions Architects."
  },
  {
    "id": "clf-sim01-63",
    "topic": "IA e machine learning",
    "q": "Uma empresa precisa procurar texto em documentos que estão armazenados no Amazon S3. Qual serviço da AWS atenderá a esses requisitos?",
    "options": [
      "Amazon Lex",
      "Amazon Kendra",
      "Amazon Polly",
      "Amazon Rekognition"
    ],
    "answer": "B",
    "explanation": "O Kendra é busca inteligente (com ML) que indexa documentos, inclusive do S3, e responde em linguagem natural. Lex cria chatbots, Polly converte texto em voz e Rekognition analisa imagens e vídeos."
  },
  {
    "id": "clf-sim01-64",
    "topic": "Governança e auditoria",
    "q": "Qual serviço da AWS uma empresa pode usar para encontrar relatórios de segurança e conformidade, incluindo relatórios da Organização Internacional para Padronização (ISO)?",
    "options": [
      "AWS Audit Manager",
      "Amazon CloudWatch",
      "AWS Config",
      "AWS Artifact"
    ],
    "answer": "D",
    "explanation": "O AWS Artifact é o portal de autoatendimento com os relatórios de auditoria e conformidade da AWS (ISO, SOC, PCI). O Audit Manager coleta evidências das suas próprias auditorias e o Config avalia configurações dos seus recursos."
  },
  {
    "id": "clf-sim01-65",
    "topic": "IA e machine learning",
    "q": "Uma empresa deseja um serviço da AWS para fornecer recomendações de produtos com base nos dados de seus clientes. Qual serviço da AWS atenderá a esse requisito?",
    "options": [
      "Amazon Rekognition",
      "Amazon Personalize",
      "Amazon Polly",
      "Amazon Comprehend"
    ],
    "answer": "B",
    "explanation": "O Personalize cria recomendações personalizadas com machine learning. Rekognition analisa imagens, Polly converte texto em voz e Comprehend extrai informações de texto."
  },
  {
    "id": "clf-sim01-f2-19",
    "topic": "IA e machine learning",
    "q": "Uma empresa está procurando um serviço de aprendizado de máquina (ML) gerenciado que possa recomendar produtos com base nos comportamentos anteriores de um cliente. Qual serviço da AWS atende a esse requisito?",
    "options": [
      "Amazon Comprehend",
      "Amazon Personalize",
      "Amazon SageMaker",
      "Amazon Pinpoint"
    ],
    "answer": "B",
    "explanation": "O Amazon Personalize recomenda produtos com base no comportamento do cliente. SageMaker serviria para construir um modelo do zero, mas não é o gerenciado pronto para isso."
  },
  {
    "id": "clf-sim01-01",
    "topic": "Migração e CAF",
    "q": "Quais capacidades estão na perspectiva da plataforma do AWS Cloud Adoption Framework (AWS CAF)? (Selecione DUAS.)",
    "options": [
      "Integração Contínua e Entrega Contínua (CI/CD)",
      "Gerenciamento de mudanças e lançamentos",
      "Gerenciamento de Desempenho e Capacidade",
      "Proteção de infraestrutura",
      "Engenharia de Dados"
    ],
    "answer": [
      "A",
      "E"
    ],
    "explanation": "A perspectiva Plataforma cobre as capacidades técnicas: arquitetura de dados, engenharia de dados, CI/CD. Proteção de infraestrutura é de Segurança; mudanças/lançamentos e desempenho/capacidade são de Operações."
  },
  {
    "id": "clf-sim01-08",
    "topic": "IAM e identidade",
    "q": "Um desenvolvedor foi contratado por uma grande empresa e precisa de credenciais da AWS. Quais são as melhores práticas de segurança que devem ser seguidas? (Selecione DUAS.)",
    "options": [
      "Adicionar o desenvolvedor ao grupo de administradores no AWS IAM",
      "Conceder ao desenvolvedor acesso apenas aos recursos da AWS necessários para realizar o trabalho",
      "Configurar uma política de senha que garanta que a senha do desenvolvedor não possa ser alterada",
      "Compartilhar as credenciais do usuário root da conta AWS com o desenvolvedor",
      "Garantir que a política de senha da conta exija um comprimento mínimo"
    ],
    "answer": [
      "B",
      "E"
    ],
    "explanation": "Menor privilégio (só as permissões necessárias) e senha forte com comprimento mínimo são boas práticas. Compartilhar o root e dar admin a todos são erros clássicos."
  },
  {
    "id": "clf-sim01-11",
    "topic": "IAM e identidade",
    "q": "Quais ações são práticas recomendadas para um usuário root de conta AWS? (Selecione DUAS.)",
    "options": [
      "Habilitar autenticação multifator (MFA) no usuário root",
      "Compartilhar credenciais do usuário root com membros da equipe",
      "Criar um usuário IAM com privilégios de administrador para tarefas administrativas diárias, em vez de usar o usuário root",
      "Criar múltiplos usuários root para a conta, separados por ambiente"
    ],
    "answer": [
      "A",
      "C"
    ],
    "explanation": "O root tem poder total e não dá pra restringir: proteja com MFA e não use no dia a dia. Uma conta tem só um usuário root."
  },
  {
    "id": "clf-sim01-12",
    "topic": "Armazenamento",
    "q": "Quais serviços da AWS podem ser usados para armazenar arquivos? (Selecione DUAS.)",
    "options": [
      "Amazon SageMaker",
      "Amazon S3",
      "Amazon Elastic Block Store (Amazon EBS)",
      "AWS Storage Gateway",
      "AWS Lambda"
    ],
    "answer": [
      "B",
      "C"
    ],
    "explanation": "S3 guarda objetos e EBS é o disco de bloco das instâncias EC2. O Storage Gateway é uma ponte entre o local e a nuvem, mas o gabarito considera só os dois serviços de armazenamento nativos."
  },
  {
    "id": "clf-sim01-16",
    "topic": "Governança e auditoria",
    "q": "Uma empresa deseja implementar controles (guardrails) em uma zona de aterrissagem (landing zone) recém-criada no AWS Control Tower. Quais serviços ou recursos da AWS a empresa pode usar para criar e definir esses controles (guardrails)? (Selecione DUAS.)",
    "options": [
      "Políticas de Controle de Serviço (SCPs)",
      "Grupos de Segurança",
      "Amazon GuardDuty",
      "Gerenciamento de Identidade e Acesso da AWS (IAM)",
      "AWS Config"
    ],
    "answer": [
      "A",
      "E"
    ],
    "explanation": "Guardrails preventivos usam SCPs (bloqueiam ações) e guardrails detectivos usam AWS Config (detectam desvios de conformidade).",
    "note": "A tela do simulado estava cortada no fim; a alternativa E (AWS Config) foi lida parcialmente e uma eventual 6ª alternativa pode não ter sido capturada."
  },
  {
    "id": "clf-sim01-35",
    "topic": "Migração e CAF",
    "q": "Quais opções são capacidades da perspectiva de pessoas do AWS Cloud Adoption Framework (AWS CAF)? (Selecione DUAS.)",
    "options": [
      "Design da Organização",
      "Gerenciamento de Portfólio",
      "Desenvolvimento de aplicações modernas",
      "Alinhamento Organizacional",
      "Gerenciamento de risco"
    ],
    "answer": [
      "A",
      "D"
    ],
    "explanation": "A perspectiva Pessoas liga tecnologia e negócio pelo lado humano: design da organização, alinhamento organizacional, cultura, treinamento e liderança. Gerenciamento de portfólio é de Negócios e gerenciamento de risco é de Governança."
  },
  {
    "id": "clf-sim01-39",
    "topic": "Migração e CAF",
    "q": "Quais opções são recomendações da jornada de transformação em nuvem do AWS Cloud Adoption Framework (AWS CAF)? (Selecione DUAS.)",
    "options": [
      "Fase de Visualização",
      "Fase de Migração e Modernização",
      "Fase de Avaliação",
      "Fase de Mobilização",
      "Fase de Alinhamento"
    ],
    "answer": [
      "A",
      "E"
    ],
    "explanation": "As quatro fases da jornada do CAF: Visualização (Envision), Alinhamento (Align), Lançamento (Launch) e Escala (Scale). Migração e Modernização, Avaliação e Mobilização são fases de outro processo (migração da AWS)."
  },
  {
    "id": "clf-sim01-41",
    "topic": "Computação",
    "q": "Quais serviços da AWS são suportados pelos Planos de Economia? (Selecione DUAS.)",
    "options": [
      "Amazon EC2",
      "Amazon SageMaker",
      "Amazon DynamoDB",
      "Amazon Redshift",
      "Amazon RDS"
    ],
    "answer": [
      "A",
      "B"
    ],
    "explanation": "Os Savings Plans cobrem computação (EC2, Lambda, Fargate) e SageMaker. DynamoDB, Redshift e RDS usam capacidade/instâncias reservadas."
  },
  {
    "id": "clf-sim01-43",
    "topic": "Banco de dados",
    "q": "Quais motores de banco de dados o Amazon Aurora suporta? (Selecione DUAS.)",
    "options": [
      "MongoDB",
      "Microsoft SQL Server",
      "PostgreSQL",
      "MySQL",
      "Oracle"
    ],
    "answer": [
      "C",
      "D"
    ],
    "explanation": "O Aurora é compatível apenas com MySQL e PostgreSQL. SQL Server e Oracle rodam no RDS comum, e o equivalente AWS de MongoDB é o DocumentDB."
  },
  {
    "id": "clf-sim01-54",
    "topic": "Preços e compras",
    "q": "Uma empresa deseja fazer um compromisso antecipado para o uso contínuo de suas instâncias de produção do Amazon EC2 em troca de um custo total reduzido. Quais opções de precificação atendem a esses requisitos com o menor custo? (Selecione DUAS.)",
    "options": [
      "Savings Plans",
      "Instâncias Spot",
      "Hosts Dedicados",
      "Instâncias Reservadas",
      "Instâncias sob demanda"
    ],
    "answer": [
      "A",
      "D"
    ],
    "explanation": "Savings Plans e Instâncias Reservadas exigem compromisso de 1 ou 3 anos em troca de desconto grande. Spot pode ser interrompida e sob demanda não tem compromisso nem desconto."
  },
  {
    "id": "clf-sim01-59",
    "topic": "Benefícios da nuvem",
    "q": "Quais habilidades são benefícios da AWS Cloud? (Selecione DUAS.)",
    "options": [
      "Trocar despesas variáveis por despesas de capital",
      "Implantar globalmente em minutos",
      "Planejar a capacidade antes das implantações",
      "Reduzir dependências da conectividade de rede",
      "Aproveitar as economias de escala"
    ],
    "answer": [
      "A",
      "B"
    ],
    "explanation": "Os 6 benefícios oficiais: despesa variável no lugar de capital, economias de escala, parar de adivinhar capacidade, aumento de velocidade e agilidade, parar de gastar com data centers e alcance global em minutos.",
    "note": "Gabarito com problema: a alternativa A está invertida (o benefício real é trocar despesa de capital por despesa variável) e 'economias de escala' (E) é benefício oficial, mas não foi marcada. Registrado como o simulado mostrou (A e B)."
  },
  {
    "id": "clf-sim02-01",
    "topic": "Governança e auditoria",
    "q": "Qual serviço ou ferramenta da AWS ajuda a gerenciar centralmente o faturamento e permitir o acesso controlado a recursos entre contas da AWS?",
    "options": [
      "AWS Organizations",
      "AWS Budgets",
      "AWS Identity and Access Management (IAM)",
      "AWS Cost Explorer"
    ],
    "answer": "A"
  },
  {
    "id": "clf-sim02-02",
    "topic": "Suporte e parceiros",
    "q": "Qual serviço da AWS um profissional de nuvem deve usar para receber orientações em tempo real para provisionamento de recursos, com base nas melhores práticas da AWS relacionadas à segurança, otimização de custos e limites de serviço?",
    "options": [
      "AWS Systems Manager",
      "AWS Security Hub",
      "AWS Config",
      "AWS Trusted Advisor"
    ],
    "answer": "D"
  },
  {
    "id": "clf-sim02-03",
    "topic": "Infraestrutura global",
    "q": "Uma empresa implanta seu aplicativo em várias Regiões da AWS e configura failover automático entre essas Regiões. Qual conceito de nuvem essa arquitetura representa?",
    "options": [
      "Confiabilidade",
      "Otimização de custos",
      "Escalabilidade",
      "Segurança"
    ],
    "answer": "A"
  },
  {
    "id": "clf-sim02-04",
    "topic": "Infraestrutura global",
    "q": "Quais dos seguintes são benefícios que uma empresa recebe ao mover uma carga de trabalho de produção local para a AWS? (Selecione DUAS.)",
    "options": [
      "A AWS gerencia toda a segurança na nuvem.",
      "A AWS oferece suporte gratuito de gerentes técnicos de conta (TAMs).",
      "A AWS fornece economias de escala.",
      "A AWS oferece alta disponibilidade.",
      "A AWS treina a equipe da empresa sobre o uso de todos os serviços da AWS."
    ],
    "answer": [
      "C",
      "D"
    ]
  },
  {
    "id": "clf-sim02-05",
    "topic": "Banco de dados",
    "q": "A equipe de TI de uma empresa está gerenciando clusters de servidores de banco de dados MySQL. A equipe de TI precisa aplicar patches no banco de dados e tirar snapshots de backup dos dados nos clusters. A empresa quer mover essa carga de trabalho para a AWS para que essas tarefas sejam realizadas automaticamente. O que a empresa deve fazer para atender a esses requisitos?",
    "options": [
      "Migrar todos os dados do banco de dados MySQL para o Amazon S3.",
      "Usar Amazon RDS com um banco de dados MySQL.",
      "Implantar clusters de servidor de banco de dados MySQL em instâncias Amazon EC2.",
      "Usar um template do AWS CloudFormation para implantar servidores de banco de dados MySQL em instâncias Amazon EC2."
    ],
    "answer": "B"
  },
  {
    "id": "clf-sim02-06",
    "topic": "Armazenamento",
    "q": "O que a classe de armazenamento Amazon S3 Intelligent-Tiering oferece?",
    "options": [
      "Retenção a longo prazo de dados copiando os dados para um volume Amazon Elastic Block Store (Amazon EBS) criptografado",
      "Economia automática de custos movendo objetos entre camadas com base nas mudanças nos padrões de acesso",
      "Armazenamento seguro, durável e de menor custo para arquivamento de dados",
      "Flexibilidade de pagamento ao reservar capacidade de armazenamento"
    ],
    "answer": "B"
  },
  {
    "id": "clf-sim02-07",
    "topic": "Computação",
    "q": "Quando um usuário quer utilizar suas licenças de software existentes por soquete, por núcleo ou por máquina virtual para um servidor Microsoft Windows em execução na AWS, qual tipo de instância do Amazon EC2 é necessário?",
    "options": [
      "Instâncias Reservadas",
      "Instâncias Spot",
      "Instâncias Dedicadas",
      "Hosts Dedicados"
    ],
    "answer": "D"
  },
  {
    "id": "clf-sim02-08",
    "topic": "Infraestrutura global",
    "q": "Uma empresa quer garantir que duas instâncias do Amazon EC2 estejam em centros de dados separados com latência mínima de comunicação entre os centros de dados. Como a empresa pode atender a esse requisito?",
    "options": [
      "Coloque ambas as instâncias EC2 em um grupo de colocação para largura de banda dedicada.",
      "Coloque uma instância EC2 on-premises e a outra em uma Região da AWS. Em seguida, conecte-as usando uma conexão VPN da AWS.",
      "Coloque as instâncias EC2 em duas Regiões da AWS separadas, conectadas com uma conexão de peering VPC.",
      "Coloque as instâncias EC2 em duas Zonas de Disponibilidade separadas dentro da mesma Região da AWS."
    ],
    "answer": "D"
  },
  {
    "id": "clf-sim02-09",
    "topic": "Computação",
    "q": "Uma empresa implanta seu aplicativo em instâncias do Amazon EC2. O aplicativo ocasionalmente experimenta aumentos súbitos na demanda. A empresa quer garantir que seu aplicativo possa responder a mudanças na demanda ao menor custo possível. Qual serviço ou ferramenta da AWS atenderá a esses requisitos?",
    "options": [
      "AWS Compute Optimizer",
      "AWS Well-Architected Framework",
      "AWS Auto Scaling",
      "AWS Cost Explorer"
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim02-10",
    "topic": "Computação",
    "q": "Qual serviço ou recurso da AWS é usado para solucionar problemas de conectividade de rede entre instâncias Amazon EC2?",
    "options": [
      "VPC Flow Logs",
      "Internet gateway",
      "AWS CloudHSM",
      "AWS Certificate Manager (ACM)"
    ],
    "answer": "A"
  },
  {
    "id": "clf-sim02-11",
    "topic": "Responsabilidade compartilhada",
    "q": "Quais opções a AWS disponibiliza para clientes que desejam aprender sobre segurança na nuvem em um ambiente conduzido por instrutor? (Selecione DUAS.)",
    "options": [
      "Blog da AWS",
      "AWS Trusted Advisor",
      "AWS Online Tech Talks",
      "Fóruns da AWS",
      "Treinamento em Sala de Aula da AWS"
    ],
    "answer": [
      "C",
      "E"
    ]
  },
  {
    "id": "clf-sim02-12",
    "topic": "Governança e auditoria",
    "q": "Uma empresa quer gerenciar centralmente políticas de segurança e serviços de cobrança em um ambiente AWS com várias contas. Qual serviço da AWS a empresa deve usar para atender a esses requisitos?",
    "options": [
      "AWS Resource Access Manager (AWS RAM)",
      "AWS Config",
      "AWS Organizations",
      "AWS Identity and Access Management (IAM)"
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim02-13",
    "topic": "IAM e identidade",
    "q": "Qual serviço da AWS oferece aos usuários a capacidade de provisionar uma conexão de rede dedicada e privada da sua rede interna para a AWS?",
    "options": [
      "AWS VPN",
      "Amazon Connect",
      "AWS CloudHSM",
      "AWS Direct Connect"
    ],
    "answer": "D"
  },
  {
    "id": "clf-sim02-14",
    "topic": "Governança e auditoria",
    "q": "Uma empresa usa Amazon Workspaces. O que um usuário pode realizar usando o AWS CloudTrail?",
    "options": [
      "Gerar um relatório de credenciais de usuários IAM.",
      "Avaliar a conformidade das configurações dos recursos da AWS com políticas e diretrizes.",
      "Garantir que as instâncias Amazon EC2 estejam atualizadas com os últimos patches de segurança.",
      "Registrar chamadas de API feitas para os serviços da AWS."
    ],
    "answer": "D"
  },
  {
    "id": "clf-sim02-15",
    "topic": "Computação",
    "q": "Uma empresa precisa executar código em resposta a uma notificação de evento que ocorre quando objetos são carregados em um bucket do Amazon S3. Qual serviço da AWS se integrará diretamente com a notificação de evento?",
    "options": [
      "AWS Elastic Beanstalk",
      "Amazon EC2",
      "AWS Lambda",
      "Amazon Elastic Container Registry (Amazon ECR)"
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim02-16",
    "topic": "Banco de dados",
    "q": "Uma empresa quer usar um serviço gerenciado para simplificar a configuração, operação e escalabilidade de seu banco de dados MySQL na Nuvem AWS. Qual serviço da AWS atenderá a esses requisitos?",
    "options": [
      "Amazon DynamoDB",
      "Amazon EMR",
      "Amazon Redshift",
      "Amazon RDS"
    ],
    "answer": "D"
  },
  {
    "id": "clf-sim02-17",
    "topic": "Suporte e parceiros",
    "q": "Qual benefício está incluído em um plano de Suporte Empresarial da AWS?",
    "options": [
      "Conformidade gerenciada como código com AWS Config",
      "Suporte à Rede de Parceiros AWS (APN) sem custo",
      "Suporte no local de engenheiros da AWS",
      "Suporte designado de um gerente técnico de conta (TAM) da AWS"
    ],
    "answer": "D"
  },
  {
    "id": "clf-sim02-18",
    "topic": "Computação",
    "q": "Uma empresa tem duas contas AWS em uma organização no AWS Organizations para faturamento consolidado. Todos os recursos da AWS da empresa estão hospedados em uma Região AWS. A Conta A comprou cinco Instâncias Reservadas Padrão (RIs) da Amazon EC2 e tem quatro instâncias EC2 em execução. A Conta B não comprou nenhuma RI e também tem quatro instâncias EC2 em execução. Qual declaração é verdadeira sobre o preço dessas oito instâncias?",
    "options": [
      "As oito instâncias serão cobradas como RIs.",
      "As oito instâncias serão cobradas como instâncias regulares.",
      "Quatro instâncias serão cobradas como RIs, e quatro serão cobradas como instâncias regulares.",
      "Cinco instâncias serão cobradas como RIs, e três serão cobradas como instâncias regulares."
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim02-19",
    "topic": "Banco de dados",
    "q": "Qual motor de banco de dados é compatível com o Amazon RDS?",
    "options": [
      "Apache Cassandra",
      "Neo4j",
      "MongoDB",
      "PostgreSQL"
    ],
    "answer": "D"
  },
  {
    "id": "clf-sim02-20",
    "topic": "Computação",
    "q": "Quais são algumas vantagens de usar instâncias do Amazon EC2 para hospedar aplicativos na Nuvem AWS em vez de localmente? (Selecione DUAS.)",
    "options": [
      "EC2 possui um modelo de preços flexível, pay-as-you-go.",
      "EC2 tem otimização automática de custo de armazenamento.",
      "EC2 integra-se com Amazon VPC, AWS CloudTrail e AWS Identity and Access Management (IAM).",
      "EC2 tem um acordo de nível de serviço (SLA) de 100%.",
      "O EC2 inclui gerenciamento de patches do sistema operacional."
    ],
    "answer": [
      "A",
      "C"
    ]
  },
  {
    "id": "clf-sim02-21",
    "topic": "Proteção de dados",
    "q": "Uma empresa está usando um serviço de terceiros para fazer backup de 10 TB de dados em uma biblioteca de fitas. O servidor de backup local está ficando sem espaço. A empresa quer usar os serviços da AWS para os backups sem alterar seus fluxos de trabalho de backup existentes. Qual serviço da AWS a empresa deve usar para atender a esses requisitos?",
    "options": [
      "Amazon Elastic Block Store (Amazon EBS)",
      "Amazon Elastic Container Service (Amazon ECS)",
      "AWS Storage Gateway",
      "AWS Lambda"
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim02-22",
    "topic": "Governança e auditoria",
    "q": "Qual serviço da AWS deve um engenheiro de nuvem usar para visualizar chamadas de API para serviços da AWS?",
    "options": [
      "AWS CloudTrail",
      "AWS Config",
      "Amazon CloudWatch",
      "AWS Artifact"
    ],
    "answer": "A"
  },
  {
    "id": "clf-sim02-23",
    "topic": "Infraestrutura global",
    "q": "Uma Zona de Disponibilidade consiste em:",
    "options": [
      "um ou mais data centers em uma única localização.",
      "dois ou mais hosts físicos em múltiplos data centers.",
      "dois ou mais data centers em várias localizações.",
      "um ou mais hosts físicos em um único data center."
    ],
    "answer": "A"
  },
  {
    "id": "clf-sim02-24",
    "q": "Qual dos seguintes é um benefício de desacoplar uma arquitetura de nuvem da AWS?",
    "options": [
      "Menos componentes para gerenciar",
      "Capacidade de atualizar componentes independentemente",
      "Custos reduzidos",
      "Latência reduzida"
    ],
    "answer": "B"
  },
  {
    "id": "clf-sim02-25",
    "topic": "Infraestrutura global",
    "q": "Uma empresa precisa de uma rede de entrega de conteúdo que forneça entrega segura de dados, vídeos, aplicativos e APIs para usuários globalmente com baixa latência e altas velocidades de transferência. Qual serviço da AWS atende a esses requisitos?",
    "options": [
      "Elastic Load Balancing",
      "Amazon S3",
      "Amazon CloudFront",
      "Amazon Elastic Transcoder"
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim02-26",
    "q": "Uma grande empresa tem uma carga de trabalho que requer que o hardware permaneça no local. A empresa quer usar os mesmos serviços de gerenciamento e controle que atualmente usa na AWS. Qual serviço da AWS a empresa deve usar para atender a esses requisitos?",
    "options": [
      "AWS Outposts",
      "AWS Fargate",
      "AWS Device Farm",
      "AWS Ground Station"
    ],
    "answer": "A"
  },
  {
    "id": "clf-sim02-27",
    "topic": "Computação",
    "q": "Qual serviço ou ferramenta da AWS fornece recomendações para ajudar os usuários a dimensionar corretamente as instâncias Amazon EC2 com base em dados históricos de uso da carga de trabalho?",
    "options": [
      "AWS Pricing Calculator",
      "AWS Systems Manager",
      "AWS App Runner",
      "AWS Compute Optimizer"
    ],
    "answer": "D"
  },
  {
    "id": "clf-sim02-28",
    "topic": "Responsabilidade compartilhada",
    "q": "Uma empresa refinou sua carga de trabalho para usar serviços específicos da AWS para melhorar a eficiência e reduzir custos. Qual tarefa é responsabilidade do cliente, de acordo com o modelo de responsabilidade compartilhada da AWS?",
    "options": [
      "Gerenciamento dos sistemas operacionais host e virtualização",
      "Manutenção da configuração de dispositivos de infraestrutura",
      "Gerenciamento dos sistemas operacionais convidados",
      "Manutenção do software que alimenta as Zonas de Disponibilidade"
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim02-29",
    "topic": "Gestão de custos",
    "q": "Qual serviço ou recurso da AWS pode ser usado para estimar custos antes da implantação?",
    "options": [
      "Relatório de Custo e Uso da AWS",
      "AWS Free Tier",
      "AWS Billing and Cost Management",
      "AWS Pricing Calculator"
    ],
    "answer": "D"
  },
  {
    "id": "clf-sim02-30",
    "topic": "Gestão de custos",
    "q": "Qual dos seguintes é um princípio de eficiência de custos relacionado à Nuvem AWS?",
    "options": [
      "Usar o Painel de Faturamento para acessar informações sobre faturas mensais.",
      "Usar AWS Organizations para combinar as despesas de várias contas em uma única fatura.",
      "Marcar todos os recursos da AWS.",
      "Dimensionar serviços com base nos requisitos de capacidade."
    ],
    "answer": "D"
  },
  {
    "id": "clf-sim02-31",
    "topic": "Gestão de custos",
    "q": "Uma empresa planeja migrar para a AWS e quer criar estimativas de custo para seus casos de uso da AWS. Qual serviço ou ferramenta da AWS a empresa pode usar para atender a esses requisitos?",
    "options": [
      "Amazon CloudWatch",
      "AWS Budgets",
      "AWS Pricing Calculator",
      "AWS Cost Explorer"
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim02-32",
    "topic": "Computação",
    "q": "Uma empresa recentemente migrou para a Nuvem AWS. A empresa precisa determinar se suas instâncias Amazon EC2 recém-importadas são do tamanho e tipo apropriados. Quais serviços da AWS podem fornecer essas informações para a empresa? (Selecione DUAS.)",
    "options": [
      "AWS Control Tower",
      "AWS Trusted Advisor",
      "AWS Compute Optimizer",
      "Amazon Forecast",
      "AWS Auto Scaling"
    ],
    "answer": [
      "B",
      "C"
    ]
  },
  {
    "id": "clf-sim02-33",
    "topic": "Gestão de custos",
    "q": "Quais fatores afetam os custos na Nuvem AWS? (Selecione DUAS.)",
    "options": [
      "O número de funções AWS Lambda não utilizadas",
      "Transferências de dados de saída sem aceleração",
      "Recursos de computação que estão atualmente em uso",
      "Transferências de dados de entrada sem aceleração",
      "O número de buckets Amazon S3 configurados"
    ],
    "answer": [
      "B",
      "C"
    ]
  },
  {
    "id": "clf-sim02-34",
    "q": "Qual princípio de design deve ser considerado ao arquitetar na Nuvem AWS?",
    "options": [
      "Projetar componentes fracamente acoplados.",
      "Pensar nos servidores como recursos não descartáveis.",
      "Usar integração síncrona de serviços.",
      "Implementar as regras menos permissivas para grupos de segurança."
    ],
    "answer": "A"
  },
  {
    "id": "clf-sim02-35",
    "topic": "IA e machine learning",
    "q": "Um desenvolvedor precisa criar um aplicativo para uma empresa de varejo. O aplicativo deve fornecer recomendações de produtos em tempo real com base em aprendizado de máquina. Qual serviço da AWS o desenvolvedor deve usar para atender a esse requisito?",
    "options": [
      "Amazon Personalize",
      "AWS Health Dashboard",
      "Amazon Forecast",
      "Amazon Transcribe"
    ],
    "answer": "A"
  },
  {
    "id": "clf-sim02-36",
    "topic": "Responsabilidade compartilhada",
    "q": "De acordo com o modelo de responsabilidade compartilhada da AWS, quais das seguintes opções são responsabilidades da AWS? (Selecione DUAS.)",
    "options": [
      "Sistemas operacionais convidados",
      "Segurança física do hardware",
      "Infraestrutura de rede e virtualização de infraestrutura",
      "Segurança dos dados da aplicação",
      "Credenciais e políticas"
    ],
    "answer": [
      "B",
      "C"
    ]
  },
  {
    "id": "clf-sim02-37",
    "topic": "Governança e auditoria",
    "q": "Qual serviço ou ferramenta da AWS o AWS Control Tower usa para criar recursos?",
    "options": [
      "AWS Trusted Advisor",
      "AWS Cost Explorer",
      "AWS CloudFormation",
      "AWS Directory Service"
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim02-38",
    "topic": "Well-Architected",
    "q": "Qual dos seguintes promove as melhores práticas de arquitetura da Nuvem AWS para projetar e operar sistemas confiáveis, seguros, eficientes e econômicos?",
    "options": [
      "Suporte Empresarial AWS",
      "AWS Well-Architected Framework",
      "Princípio do menor privilégio",
      "AWS Serverless Application Model framework"
    ],
    "answer": "B"
  },
  {
    "id": "clf-sim02-39",
    "topic": "IAM e identidade",
    "q": "Uma empresa está configurando seu ambiente na Nuvem AWS. Os administradores da empresa precisam agrupar usuários e aplicar permissões ao grupo. Qual serviço ou recurso da AWS a empresa pode usar para atender a esses requisitos?",
    "options": [
      "AWS Identity and Access Management (IAM)",
      "Grupos de recursos",
      "AWS Organizations",
      "Marcação de recursos"
    ],
    "answer": "A"
  },
  {
    "id": "clf-sim02-40",
    "topic": "Computação",
    "q": "Uma empresa está hospedando um aplicativo web em um contêiner Docker no Amazon EC2. A AWS é responsável por qual das seguintes tarefas?",
    "options": [
      "Gerenciar o sistema operacional convidado, incluindo atualizações e patches de segurança",
      "Escalar a aplicação web e os serviços desenvolvidos com Docker",
      "Provisionamento ou agendamento de contêineres para executar em clusters e manter sua disponibilidade",
      "Realizar manutenção de hardware nas instalações da AWS que executam a Nuvem AWS"
    ],
    "answer": "D"
  },
  {
    "id": "clf-sim02-41",
    "topic": "Computação",
    "q": "Um aplicativo está sendo executado em várias instâncias do Amazon EC2. A empresa quer tornar o aplicativo altamente disponível configurando um balanceador de carga com solicitações encaminhadas para as instâncias do EC2 com base nos caminhos de URL. Qual balanceador de carga da AWS atenderá a esses requisitos e exigirá o MENOR esforço para implantar?",
    "options": [
      "Load Balancer personalizado no Amazon EC2",
      "Application Load Balancer",
      "Network Load Balancer",
      "AWS OpsWorks Load Balancer"
    ],
    "answer": "B"
  },
  {
    "id": "clf-sim02-42",
    "topic": "Suporte e parceiros",
    "q": "Qual plano de suporte da AWS oferece aos clientes acesso a um gerente de conta técnica (TAM) da AWS?",
    "options": [
      "Suporte Produção AWS",
      "Suporte ao Desenvolvedor AWS",
      "Suporte Empresarial AWS",
      "Suporte Básico AWS"
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim02-43",
    "topic": "Banco de dados",
    "q": "Uma empresa quer hospedar seus bancos de dados relacionais na AWS. Os bancos de dados têm esquemas predefinidos que a empresa precisa replicar na AWS. Quais serviços da AWS a empresa poderia usar para os bancos de dados? (Selecione DUAS.)",
    "options": [
      "Amazon Aurora",
      "Amazon DocumentDB (com compatibilidade com MongoDB)",
      "Amazon Neptune",
      "Amazon RDS",
      "Amazon DynamoDB"
    ],
    "answer": [
      "A",
      "D"
    ]
  },
  {
    "id": "clf-sim02-44",
    "topic": "IAM e identidade",
    "q": "Qual tarefa requer o uso das credenciais do usuário root da conta AWS?",
    "options": [
      "A mudança para um plano de Suporte AWS diferente",
      "A exclusão de usuários IAM",
      "A exclusão de instâncias Amazon EC2",
      "A criação de uma organização no AWS Organizations"
    ],
    "answer": "D"
  },
  {
    "id": "clf-sim02-45",
    "topic": "IAM e identidade",
    "q": "Qual recurso da Nuvem AWS dá aos usuários a capacidade de pagar com base nas necessidades atuais em vez das necessidades previstas?",
    "options": [
      "Preços pay-as-you-go (pague conforme o uso)",
      "AWS Budgets",
      "Descontos por volume",
      "Savings Plans"
    ],
    "answer": "A"
  },
  {
    "id": "clf-sim02-46",
    "topic": "Governança e auditoria",
    "q": "Um engenheiro de nuvem precisa baixar documentos de segurança e conformidade da AWS para uma auditoria futura. Qual serviço da AWS pode fornecer os documentos?",
    "options": [
      "AWS Artifact",
      "AWS Trusted Advisor",
      "AWS Systems Manager",
      "AWS Well-Architected Tool"
    ],
    "answer": "A"
  },
  {
    "id": "clf-sim02-47",
    "topic": "Gestão de custos",
    "q": "Qual prática recomendada de governança de custos este exemplo mostra?",
    "options": [
      "Otimização de arquitetura",
      "Controles de recursos",
      "Aplicação de marcação",
      "Alocação de custos"
    ],
    "answer": "A"
  },
  {
    "id": "clf-sim02-48",
    "topic": "IAM e identidade",
    "q": "Qual das seguintes é uma vantagem que os usuários experimentam ao mover cargas de trabalho on-premises para a Nuvem AWS?",
    "options": [
      "Eliminação de despesas operacionais",
      "Distribuição de todos os controles operacionais para a AWS",
      "Eliminação de despesas para operar e manter data centers",
      "Descontos de preço que são idênticos aos descontos de provedores de hardware"
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim02-49",
    "topic": "IA e machine learning",
    "q": "Uma empresa tem uma plataforma de mídia social onde os usuários enviam e compartilham fotos com outros usuários. A empresa quer identificar e remover fotos inadequadas. A empresa não tem cientistas de aprendizado de máquina (ML) e deve construir essa capacidade de detecção sem expertise em ML. Qual serviço da AWS a empresa deve usar para construir essa capacidade?",
    "options": [
      "Amazon Rekognition",
      "Amazon Textract",
      "Amazon Comprehend",
      "Amazon SageMaker"
    ],
    "answer": "A"
  },
  {
    "id": "clf-sim02-50",
    "topic": "IAM e identidade",
    "q": "Quais dos seguintes são serviços de autenticação de usuários gerenciados pela AWS? (Selecione DUAS.)",
    "options": [
      "AWS License Manager",
      "AWS Lambda",
      "AWS Identity and Access Management (IAM)",
      "Amazon Cognito",
      "AWS CodeStar"
    ],
    "answer": [
      "C",
      "D"
    ]
  },
  {
    "id": "clf-sim02-51",
    "topic": "Well-Architected",
    "q": "Quais princípios de design suportam o pilar de confiabilidade do AWS Well-Architected Framework? (Selecione DUAS.)",
    "options": [
      "Implantar recursos globalmente para melhorar o tempo de resposta.",
      "Recuperar automaticamente de falhas.",
      "Habilitar rastreabilidade.",
      "Escalar automaticamente para atender à demanda.",
      "Executar operações como código."
    ],
    "answer": [
      "B",
      "D"
    ]
  },
  {
    "id": "clf-sim02-52",
    "q": "Qual serviço ou recurso da AWS é usado para enviar mensagens de texto e e-mail a partir de aplicativos distribuídos?",
    "options": [
      "Amazon Simple Queue Service (Amazon SQS)",
      "Amazon Simple Email Service (Amazon SES)",
      "Alertas do Amazon CloudWatch",
      "Amazon Simple Notification Service (Amazon SNS)"
    ],
    "answer": "D"
  },
  {
    "id": "clf-sim02-53",
    "topic": "Migração e CAF",
    "q": "Quais são as vantagens de migrar para a nuvem da AWS? (Selecione DUAS.)",
    "options": [
      "Não se preocupar mais com controles de acesso dos usuários.",
      "Não precisar mais adivinhar a capacidade que será necessária.",
      "A capacidade de ter controle total sobre a infraestrutura física.",
      "A capacidade de transferir a responsabilidade de toda a segurança para a AWS.",
      "A capacidade de usar o modelo pay-as-you-go."
    ],
    "answer": [
      "B",
      "E"
    ]
  },
  {
    "id": "clf-sim02-54",
    "topic": "Well-Architected",
    "q": "Uma empresa quer proteger suas informações, sistemas e ativos na Nuvem AWS enquanto realiza tarefas de avaliação e mitigação de riscos. Qual pilar do AWS Well-Architected Framework é suportado por esses objetivos?",
    "options": [
      "Confiabilidade",
      "Excelência operacional",
      "Segurança",
      "Eficiência de desempenho"
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim02-55",
    "topic": "Armazenamento",
    "q": "Uma empresa armazena dados em um bucket do Amazon S3. A empresa deve controlar quem tem permissão para ler, escrever ou excluir objetos que a empresa armazena no bucket do S3. Qual tarefa é responsabilidade da AWS, de acordo com o modelo de responsabilidade compartilhada da AWS?",
    "options": [
      "Fornecer segurança para contas de usuário do Workspaces através do AWS Identity and Access Management (IAM).",
      "Garantir a segurança e a proteção ambiental da infraestrutura da AWS que hospeda Workspaces.",
      "Configurar autenticação multifator (MFA) para cada conta de usuário do Workspaces.",
      "Configurar o AWS CloudTrail para registrar chamadas de API e atividade de usuários."
    ],
    "answer": "B"
  },
  {
    "id": "clf-sim02-56",
    "topic": "Computação",
    "q": "Uma empresa está projetando um aplicativo web que será executado em instâncias do Amazon EC2. Quais serviços e recursos da AWS melhorarão a disponibilidade e reduzirão o impacto de falhas para este aplicativo? (Selecione DUAS.)",
    "options": [
      "ACLs de sub-rede VPC para verificar a integridade de um serviço",
      "Recursos que estão distribuídos em vários pontos de presença da AWS",
      "Configuração do AWS Server Migration Service (AWS SMS) para mover as instâncias EC2 para uma região diferente da AWS",
      "Recursos distribuídos por várias Zonas de Disponibilidade",
      "Amazon EC2 Auto Scaling para as instâncias EC2"
    ],
    "answer": [
      "D",
      "E"
    ]
  },
  {
    "id": "clf-sim02-57",
    "topic": "Infraestrutura global",
    "q": "Qual das seguintes opções descreve uma Região da AWS?",
    "options": [
      "Um conjunto de data centers abrangendo vários países",
      "Uma localização específica dentro de uma área geográfica que fornece alta disponibilidade",
      "Uma visão global do ambiente de computação em nuvem de um usuário",
      "Uma coleção de bancos de dados que podem ser acessados apenas a partir de uma área geográfica específica"
    ],
    "answer": "B"
  },
  {
    "id": "clf-sim02-58",
    "topic": "Computação",
    "q": "A base de usuários de uma empresa precisa acessar remotamente computadores de desktop virtual da internet. Qual serviço da AWS fornece essa funcionalidade?",
    "options": [
      "Amazon Upstream 2.0",
      "Amazon Cognito",
      "Amazon Workspaces",
      "Amazon Connect"
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim02-59",
    "topic": "Análise de dados",
    "q": "Uma empresa precisa usar painéis e gráficos para analisar insights a partir de dados de negócios. Qual serviço da AWS fornecerá os painéis e gráficos para esses insights?",
    "options": [
      "Amazon Macie",
      "AWS CloudTrail",
      "Amazon QuickSight",
      "Amazon Aurora"
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim02-60",
    "topic": "Well-Architected",
    "q": "Qual pilar do AWS Well-Architected Framework se concentra na capacidade de executar cargas de trabalho de forma eficaz, obter insights sobre operações e melhorar continuamente os processos e procedimentos de suporte?",
    "options": [
      "Confiabilidade",
      "Excelência operacional",
      "Otimização de custos",
      "Eficiência de desempenho"
    ],
    "answer": "B"
  },
  {
    "id": "clf-sim02-61",
    "topic": "Análise de dados",
    "q": "Uma empresa tem armazenado relatórios mensais em um bucket do Amazon S3. A empresa exporta os dados dos relatórios para arquivos de valores separados por vírgulas (.csv). Um desenvolvedor deseja escrever uma consulta simples que possa ler todos esses arquivos e gerar um relatório resumido. Qual serviço ou recurso da AWS o desenvolvedor deve usar para atender a esses requisitos com a MENOR quantidade de esforço operacional?",
    "options": [
      "Amazon S3 Select",
      "Amazon EC2",
      "Amazon Redshift",
      "Amazon Athena"
    ],
    "answer": "D"
  },
  {
    "id": "clf-sim02-62",
    "topic": "Infraestrutura global",
    "q": "Quais são as características das Zonas de Disponibilidade? (Selecione DUAS.)",
    "options": [
      "Todo o tráfego entre as Zonas de Disponibilidade é criptografado.",
      "Cada Zona de Disponibilidade contém um único data center.",
      "Zonas de Disponibilidade dentro de uma região da AWS compartilham energia redundante, rede e conectividade.",
      "Todas as Zonas de Disponibilidade em uma Região da AWS são interconectadas com uma rede de alta largura de banda e baixa latência.",
      "As Zonas de Disponibilidade são fisicamente separadas por uma distância mínima de 150 km (100 milhas)."
    ],
    "answer": [
      "D",
      "E"
    ]
  },
  {
    "id": "clf-sim02-63",
    "topic": "Gestão de custos",
    "q": "Qual opção é uma vantagem da computação em nuvem da AWS que minimiza os custos variáveis?",
    "options": [
      "Alta disponibilidade",
      "Alcance global",
      "Economias de escala",
      "Agilidade"
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim02-64",
    "topic": "Governança e auditoria",
    "q": "Qual atividade as empresas podem realizar usando AWS Organizations?",
    "options": [
      "Monitorar o desempenho de aplicativos.",
      "Migrar aplicativos para microservices.",
      "Gerenciar políticas de controle de serviço (SCPs).",
      "Solucionar problemas de desempenho de aplicativos."
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim02-65",
    "topic": "Armazenamento",
    "q": "Amazon Elastic File System (Amazon EFS) e Amazon FSx oferecem que tipo de armazenamento?",
    "options": [
      "Armazenamento de objetos",
      "Armazenamento em bloco",
      "Armazenamento de arquivos",
      "Armazenamento de instâncias"
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim03-01",
    "topic": "Suporte e parceiros",
    "q": "Quais benefícios os clientes podem obter ao usar o AWS Marketplace? (Selecione DUAS.)",
    "options": [
      "Menos objeções legais",
      "Capacidade de pagar com cartões de crédito",
      "Velocidade dos negócios",
      "Uso gratuito de todos os serviços pela primeira hora",
      "Nenhuma exigência de licenças de produtos para qualquer produto"
    ],
    "answer": [
      "A",
      "C"
    ]
  },
  {
    "id": "clf-sim03-02",
    "topic": "IAM e identidade",
    "q": "Quais das seguintes ações são controladas com o AWS Identity and Access Management (IAM)? (Selecione DUAS.)",
    "options": [
      "Controlar o acesso às APIs de serviço da AWS e a outros recursos específicos.",
      "Fornecer proteção de firewall para aplicativos contra ataques comuns na web.",
      "Fornecer detecção inteligente de ameaças e monitoramento contínuo.",
      "Proteger o ambiente da AWS usando autenticação multifator (MFA).",
      "Conceder aos usuários acesso aos data centers da AWS."
    ],
    "answer": [
      "A",
      "D"
    ]
  },
  {
    "id": "clf-sim03-03",
    "topic": "Armazenamento",
    "q": "O Amazon Elastic File System (Amazon EFS) e o Amazon FSx oferecem que tipo de armazenamento?",
    "options": [
      "Armazenamento de instância",
      "Armazenamento em bloco",
      "Armazenamento de objetos",
      "Armazenamento de arquivos"
    ],
    "answer": "D"
  },
  {
    "id": "clf-sim03-04",
    "topic": "Detecção de ameaças e vulnerabilidades",
    "q": "Uma empresa quer níveis elevados de detecção e mitigação quase em tempo real (NRT) contra ataques DDoS grandes e sofisticados em aplicações rodando na AWS. Qual serviço da AWS a empresa deve usar?",
    "options": [
      "Amazon Macie",
      "Amazon Inspector",
      "AWS Shield Advanced",
      "Amazon GuardDuty"
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim03-05",
    "topic": "Banco de dados",
    "q": "A equipe de TI de uma empresa está gerenciando clusters de servidores de banco de dados MySQL. A equipe de TI precisa aplicar patches no banco de dados e fazer snapshots de backup dos dados nos clusters. A empresa quer mover essa carga de trabalho para a AWS para que essas tarefas sejam concluídas automaticamente. O que a empresa deve fazer para atender a esses requisitos?",
    "options": [
      "Implantar clusters de servidor de banco de dados MySQL em instâncias Amazon EC2.",
      "Migrar todos os dados do banco de dados MySQL para o Amazon S3.",
      "Usar Amazon RDS com um banco de dados MySQL.",
      "Usar um template do AWS CloudFormation para implantar servidores de banco de dados MySQL em instâncias do Amazon EC2."
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim03-06",
    "topic": "Proteção de dados",
    "q": "Qual serviço ou recurso da AWS está associado a uma sub-rede em uma VPC e é usado para controlar o tráfego de entrada e saída?",
    "options": [
      "VPC Flow Logs",
      "Amazon Inspector",
      "ACLs de rede",
      "AWS Shield"
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim03-07",
    "topic": "Gestão de custos",
    "q": "Uma empresa está executando sua aplicação na AWS Cloud. A empresa quer revisar periodicamente sua conta da AWS em busca de oportunidades de otimização de custos. Qual serviço ou ferramenta da AWS a empresa pode usar para atender a esses requisitos?",
    "options": [
      "AWS Budgets",
      "AWS Cost Explorer",
      "AWS Pricing Calculator",
      "AWS Trusted Advisor"
    ],
    "answer": "B"
  },
  {
    "id": "clf-sim03-08",
    "topic": "Suporte e parceiros",
    "q": "Uma empresa quer monitorar grupos de segurança mal configurados que estão permitindo acesso irrestrito a portas específicas. Qual serviço da AWS atenderá a esse requisito?",
    "options": [
      "AWS Trusted Advisor",
      "Amazon GuardDuty",
      "Amazon CloudWatch",
      "AWS Health Dashboard"
    ],
    "answer": "A"
  },
  {
    "id": "clf-sim03-09",
    "topic": "Armazenamento",
    "q": "Uma empresa está se preparando para lançar um site redesenhado na AWS. Usuários de todo o mundo irão baixar manuais digitais do site. Qual solução da AWS a empresa deve usar para fornecer esses arquivos estáticos de forma segura?",
    "options": [
      "Instâncias do Amazon EC2 com um Application Load Balancer",
      "Amazon Elastic File System (Amazon EFS)",
      "Amazon CloudFront com Amazon S3",
      "Amazon Kinesis Data Streams"
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim03-10",
    "topic": "Infraestrutura global",
    "q": "Uma empresa quer lançar sua aplicação web em uma segunda Região da AWS. A empresa precisa determinar quais serviços devem ser configurados regionalmente para esse lançamento. Quais serviços da AWS podem ser configurados no nível da Região? (Selecione DOIS.)",
    "options": [
      "AWS WAF",
      "Amazon DynamoDB",
      "Amazon Route 53",
      "Amazon EC2",
      "Amazon CloudFront"
    ],
    "answer": [
      "A",
      "C"
    ]
  },
  {
    "id": "clf-sim03-11",
    "topic": "Armazenamento",
    "q": "Uma empresa quer armazenar dados com alta disponibilidade, criptografar os dados em repouso e ter acesso direto aos dados pela internet. Qual serviço da AWS atenderá a esses requisitos da maneira mais econômica?",
    "options": [
      "Amazon Elastic Block Store (Amazon EBS)",
      "AWS Storage Gateway",
      "Amazon S3",
      "Amazon Elastic File System (Amazon EFS)"
    ],
    "answer": "D",
    "note": "Revisar gabarito: o simulado marca D; a documentação da AWS sugere C. Pelo enunciado (alta disponibilidade, criptografia em repouso, acesso direto pela internet, mais econômico) o esperado seria Amazon S3. O EFS não é acessado direto pela internet."
  },
  {
    "id": "clf-sim03-12",
    "q": "Um desenvolvedor precisa manter uma infraestrutura de ambiente de desenvolvimento e uma infraestrutura de ambiente de produção de maneira repetível. Qual serviço da AWS o desenvolvedor deve usar para atender a esses requisitos?",
    "options": [
      "AWS Ground Station",
      "AWS IoT Device Defender",
      "AWS CloudFormation",
      "AWS Shield"
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim03-13",
    "topic": "Governança e auditoria",
    "q": "Uma empresa precisa identificar quem acessou um serviço da AWS e qual ação foi executada por um determinado período de tempo. Qual serviço da AWS a empresa deve usar para atender a esse requisito?",
    "options": [
      "AWS CloudTrail",
      "AWS Security Hub",
      "Amazon CloudWatch",
      "Amazon Inspector"
    ],
    "answer": "A"
  },
  {
    "id": "clf-sim03-14",
    "topic": "Preços e compras",
    "q": "Uma empresa precisa executar uma carga de trabalho para várias aplicações de renderização de imagens em batch. É aceitável que a carga de trabalho experimente tempo de inatividade. Qual modelo de precificação do Amazon EC2 seria MAIS econômico nessa situação?",
    "options": [
      "Instâncias reservadas",
      "Instâncias Dedicadas",
      "Spot Instances",
      "Instâncias sob demanda"
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim03-15",
    "topic": "Computação",
    "q": "Uma empresa tem uma carga de trabalho de aplicação que é sem estado por design e pode sustentar períodos ocasionais de inatividade. A aplicação realiza cálculos massivamente paralelos. Qual modelo de precificação do Amazon EC2 a empresa deve escolher para sua aplicação para reduzir custos?",
    "options": [
      "Instâncias Spot",
      "Instâncias sob demanda",
      "Instâncias Reservadas",
      "Instâncias Dedicadas"
    ],
    "answer": "A"
  },
  {
    "id": "clf-sim03-16",
    "topic": "Well-Architected",
    "q": "Uma empresa simula fluxos de trabalho para revisar e validar que todos os processos são eficazes e que a equipe está familiarizada com os processos. Qual princípio de design do AWS Well-Architected Framework a empresa está seguindo com essa prática?",
    "options": [
      "Estruturar a empresa para apoiar os resultados de negócios.",
      "Refinar procedimentos operacionais frequentemente.",
      "Executar operações como código.",
      "Fazer mudanças frequentes, pequenas e reversíveis."
    ],
    "answer": "B"
  },
  {
    "id": "clf-sim03-17",
    "topic": "Computação",
    "q": "Uma empresa tem uma aplicação que roda periodicamente em um ambiente on-premises. A aplicação roda por algumas horas na maioria dos dias, mas roda por 8 horas por dia durante uma semana no final de cada mês. Qual serviço ou recurso da AWS deve ser usado para hospedar a aplicação na AWS Cloud?",
    "options": [
      "Instâncias reservadas padrão do Amazon EC2",
      "AWS Wavelength",
      "Instâncias sob demanda do Amazon EC2",
      "Application Load Balancer"
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim03-18",
    "topic": "Armazenamento",
    "q": "Uma empresa executa aplicações de negócios em um data center local e na AWS Cloud. A empresa precisa de um sistema de arquivos compartilhado que possa estar disponível para ambos os ambientes. Qual serviço da AWS atende a esses requisitos?",
    "options": [
      "Amazon S3",
      "Amazon Elastic Block Store (Amazon EBS)",
      "Amazon ElastiCache",
      "Amazon Elastic File System (Amazon EFS)"
    ],
    "answer": "D"
  },
  {
    "id": "clf-sim03-19",
    "topic": "Governança e auditoria",
    "q": "Uma empresa precisa executar algumas de suas cargas de trabalho no local para cumprir diretrizes regulatórias. A empresa deseja usar a AWS Cloud para executar cargas de trabalho que não precisam estar no local. A empresa também deseja usar as mesmas chamadas de API para as cargas de trabalho no local e na nuvem. Qual serviço ou recurso da AWS a empresa deve usar para atender a esses requisitos?",
    "options": [
      "AWS Wavelength",
      "Hosts dedicados",
      "AWS Outposts",
      "Zonas de Disponibilidade"
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim03-20",
    "topic": "Análise de dados",
    "q": "Uma empresa precisa usar um serviço de consulta interativa sem servidor para analisar dados no Amazon S3. O serviço de consulta deve suportar SQL padrão. Qual serviço da AWS atenderá a esses requisitos?",
    "options": [
      "Amazon Redshift",
      "Amazon Athena",
      "AWS Glue",
      "Amazon Kinesis Data Streams"
    ],
    "answer": "B"
  },
  {
    "id": "clf-sim03-21",
    "topic": "Gestão de custos",
    "q": "Uma empresa quer receber alertas para monitorar seus custos operacionais gerais para sua infraestrutura de nuvem pública da AWS. Qual oferta da AWS atenderá a esses requisitos?",
    "options": [
      "AWS Budgets",
      "Planos de economia de computação",
      "Amazon EventBridge",
      "Migration Evaluator"
    ],
    "answer": "A"
  },
  {
    "id": "clf-sim03-22",
    "topic": "Migração e CAF",
    "q": "Uma empresa quer usar as tecnologias mais recentes e deseja minimizar seu investimento de capital. Em vez de atualizar a infraestrutura local, a empresa quer migrar para a AWS Cloud. Qual benefício da AWS Cloud esse cenário descreve?",
    "options": [
      "A troca de despesas de infraestrutura por despesas operacionais",
      "A capacidade de se tornar global em minutos",
      "Economias de escala massivas",
      "Aumento na velocidade para o mercado"
    ],
    "answer": "A"
  },
  {
    "id": "clf-sim03-23",
    "topic": "IAM e identidade",
    "q": "Uma empresa está coletando padrões de comportamento dos usuários para identificar como atingir metas de impacto sustentável. Quais diretrizes são melhores práticas para a empresa implementar para atingir essas metas? (Selecione DUAS.)",
    "options": [
      "Dimensionar a infraestrutura com base no número de usuários.",
      "Eliminar a criação e manutenção de ativos não utilizados.",
      "Dimensionar recursos com capacidade excessiva e remover auto scaling.",
      "Escalar a infraestrutura com a carga de usuários.",
      "Maximizar a distância geográfica entre cargas de trabalho e locais de usuários."
    ],
    "answer": [
      "B",
      "D"
    ]
  },
  {
    "id": "clf-sim03-24",
    "topic": "IAM e identidade",
    "q": "Uma empresa está projetando uma solução de gerenciamento de acesso e identidade para um aplicativo. A empresa deseja que os usuários possam usar suas contas de redes sociais, e-mail ou compras online para acessar o aplicativo. Qual serviço da AWS fornece essa funcionalidade?",
    "options": [
      "Amazon Cognito",
      "AWS IAM Identity Center (AWS Single Sign-On)",
      "AWS Identity and Access Management (IAM)",
      "AWS Config"
    ],
    "answer": "A"
  },
  {
    "id": "clf-sim03-25",
    "q": "Uma empresa configurou uma VPC em sua conta AWS e criou um subnet na VPC. A empresa quer tornar a subnet pública. Quais recursos da AWS a empresa deve usar para atender a esses requisitos? (Selecione DUAS.)",
    "options": [
      "Amazon VPC NAT Gateway",
      "ACL de rede do Amazon VPC",
      "Amazon EC2 security groups",
      "Tabelas de rotas do Amazon VPC",
      "Gateway de internet do Amazon VPC"
    ],
    "answer": [
      "D",
      "E"
    ]
  },
  {
    "id": "clf-sim03-26",
    "topic": "Detecção de ameaças e vulnerabilidades",
    "q": "Uma empresa está executando sua aplicação na AWS Cloud e quer se proteger contra um ataque DDoS. A equipe de segurança da empresa quer visibilidade quase em tempo real sobre ataques DDoS. Qual serviço ou filtro de tráfego da AWS atenderá a esses requisitos com o MAIOR número de recursos para proteção contra DDoS?",
    "options": [
      "ACLs de rede",
      "AWS Shield Advanced",
      "Amazon GuardDuty",
      "AWS Shield"
    ],
    "answer": "B"
  },
  {
    "id": "clf-sim03-27",
    "topic": "IAM e identidade",
    "q": "Um engenheiro de TI precisa acessar serviços da AWS a partir de uma aplicação on-premises. Quais credenciais ou chaves a aplicação precisa para autenticação?",
    "options": [
      "Chave de acesso IAM e segredo",
      "Chaves do AWS Key Management Service (AWS KMS)",
      "Nome de usuário e senha da conta da AWS",
      "Pares de chaves do Amazon EC2"
    ],
    "answer": "A"
  },
  {
    "id": "clf-sim03-28",
    "topic": "Redes e VPC",
    "q": "Quais tarefas são responsabilidades do cliente, de acordo com o modelo de responsabilidade compartilhada da AWS? (Selecione DUAS.)",
    "options": [
      "Configurar o firewall do grupo de segurança fornecido pela AWS.",
      "Selecionar instâncias do Amazon EC2 para executar o AWS Lambda.",
      "Classificar ativos da empresa na AWS Cloud.",
      "Corrigir ou atualizar o Amazon DynamoDB.",
      "Determinar quais Zonas de Disponibilidade usar para os buckets do Amazon S3."
    ],
    "answer": [
      "A",
      "C"
    ]
  },
  {
    "id": "clf-sim03-29",
    "topic": "Banco de dados",
    "q": "Qual serviço é um serviço de armazenamento de dados em memória da AWS?",
    "options": [
      "Amazon Aurora",
      "Amazon ElastiCache",
      "Amazon DynamoDB",
      "Amazon RDS"
    ],
    "answer": "B"
  },
  {
    "id": "clf-sim03-30",
    "topic": "Migração e CAF",
    "q": "Uma empresa está planejando migrar para a AWS Cloud. A empresa está conduzindo uma transformação organizacional e quer se tornar mais responsiva às consultas e feedback dos clientes. Quais tarefas a empresa deve realizar para atender a esses requisitos, de acordo com o AWS Cloud Adoption Framework (AWS CAF)? (Selecione DUAS.)",
    "options": [
      "Migrar e modernizar a infraestrutura legada.",
      "Usar uma nova plataforma de dados e análises para criar insights acionáveis.",
      "Criar novas propostas de valor com novos produtos e serviços.",
      "Usar métodos ágeis para iterar e evoluir rapidamente.",
      "Realinhar equipes para se concentrar em produtos e fluxos de valor."
    ],
    "answer": [
      "D",
      "E"
    ]
  },
  {
    "id": "clf-sim03-31",
    "topic": "Migração e CAF",
    "q": "Uma empresa está usando AWS Organizations para configurar contas AWS. A empresa está planejando sua migração para a AWS Cloud. A empresa está identificando suas lacunas de capacidade usando as perspectivas do AWS Cloud Adoption Framework (AWS CAF). Qual fase da jornada de transformação na nuvem inclui essas atividades de identificação?",
    "options": [
      "Escalar",
      "Alinhar",
      "Lançar",
      "Envision"
    ],
    "answer": "D",
    "note": "Revisar gabarito: o simulado marca D; a documentação da AWS sugere B. Identificar lacunas de capacidade nas perspectivas do AWS CAF é atividade da fase Alinhar (Align). Envision foca em oportunidades e valor de negócio."
  },
  {
    "id": "clf-sim03-32",
    "topic": "Governança e auditoria",
    "q": "Uma empresa tem um requisito de conformidade para registrar e avaliar mudanças de configuração, bem como realizar ações de remediação em recursos da AWS. Qual serviço da AWS a empresa deve usar?",
    "options": [
      "AWS CloudTrail",
      "AWS Secrets Manager",
      "AWS Config",
      "AWS Trusted Advisor"
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim03-33",
    "topic": "Computação",
    "q": "Um engenheiro de software deseja lançar uma máquina virtual (VM) e um banco de dados MySQL na AWS. Qual serviço da AWS atenderá a esses requisitos com o MENOR esforço operacional?",
    "options": [
      "Amazon Lightsail",
      "Amazon Elastic Container Service (Amazon ECS)",
      "Amazon EC2",
      "AWS Elastic Beanstalk"
    ],
    "answer": "D",
    "note": "Revisar gabarito: o simulado marca D; a documentação da AWS sugere A. VM + banco MySQL com o menor esforço operacional aponta para Amazon Lightsail. Elastic Beanstalk implanta aplicações web."
  },
  {
    "id": "clf-sim03-34",
    "topic": "Responsabilidade compartilhada",
    "q": "Qual opção é responsabilidade da AWS segundo o modelo de responsabilidade compartilhada da AWS?",
    "options": [
      "Configuração de rede e firewall",
      "Criptografia de dados do lado do cliente",
      "Gerenciamento de permissões de usuário",
      "Hardware e infraestrutura"
    ],
    "answer": "D"
  },
  {
    "id": "clf-sim03-35",
    "topic": "IAM e identidade",
    "q": "Uma empresa precisa armazenar com segurança credenciais importantes que uma aplicação usa para conectar usuários a um banco de dados. Qual serviço da AWS pode atender a essa necessidade com a menor quantidade de sobrecarga operacional?",
    "options": [
      "Amazon GuardDuty",
      "AWS Secrets Manager",
      "AWS Key Management Service (AWS KMS)",
      "AWS Config"
    ],
    "answer": "B"
  },
  {
    "id": "clf-sim03-36",
    "topic": "Infraestrutura global",
    "q": "Um auditor está se preparando para uma auditoria de segurança anual. O auditor solicita detalhes de certificação para os recursos hospedados da AWS de uma empresa em várias Zonas de Disponibilidade na Região us-east-1. Como a empresa deve responder à solicitação do auditor?",
    "options": [
      "Usar o AWS Artifact para baixar o relatório aplicável para os controles de segurança da AWS. Fornecer o relatório ao auditor.",
      "Explicar ao auditor que a AWS não precisa ser auditada porque o aplicativo da empresa está hospedado em várias Zonas de Disponibilidade.",
      "Abrir um ticket de suporte da AWS para solicitar que o gerente de conta técnica (TAM) da AWS responda e ajude o auditor.",
      "Abrir um ticket de suporte da AWS para solicitar que o auditor receba aprovação para realizar uma avaliação presencial dos data centers da AWS onde a empresa opera."
    ],
    "answer": "A"
  },
  {
    "id": "clf-sim03-37",
    "topic": "Detecção de ameaças e vulnerabilidades",
    "q": "Qual serviço da AWS fornece detecção de ameaças monitorando atividades maliciosas e ações não autorizadas para proteger contas da AWS, cargas de trabalho e dados armazenados no Amazon S3?",
    "options": [
      "Amazon GuardDuty",
      "AWS Firewall Manager",
      "Amazon Inspector",
      "AWS Shield"
    ],
    "answer": "A"
  },
  {
    "id": "clf-sim03-38",
    "topic": "Well-Architected",
    "q": "Qual opção é um pilar do AWS Well-Architected Framework?",
    "options": [
      "Otimização de custos",
      "Gerenciamento de patches",
      "Estratégia de tecnologia de negócios",
      "Controles físicos e ambientais"
    ],
    "answer": "A"
  },
  {
    "id": "clf-sim03-39",
    "topic": "Computação",
    "q": "Um desenvolvedor que não tem experiência com a AWS Cloud quer usar a tecnologia da AWS para construir uma aplicação web. Qual serviço da AWS o desenvolvedor deve usar para começar a construir a aplicação?",
    "options": [
      "Amazon SageMaker",
      "AWS Lambda",
      "Amazon Lightsail",
      "Amazon Elastic Container Service (Amazon ECS)"
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim03-40",
    "topic": "Computação",
    "q": "No modelo de responsabilidade compartilhada da AWS, quais tarefas são responsabilidade da AWS? (Selecione DUAS.)",
    "options": [
      "Gerenciar o acesso aos dados em um bucket do Amazon S3.",
      "Monitorar a saúde de uma Zona de Disponibilidade.",
      "Aplicar patch no sistema operacional de uma instância Amazon EC2.",
      "Proteger a infraestrutura que executa as instâncias do Amazon EC2.",
      "Configurar um grupo de segurança."
    ],
    "answer": [
      "B",
      "D"
    ]
  },
  {
    "id": "clf-sim03-41",
    "topic": "Migração e CAF",
    "q": "Uma empresa está planejando migrar sua aplicação para a AWS Cloud. Qual ferramenta ou conjunto de recursos da AWS a empresa deve usar para analisar e avaliar sua prontidão para a migração?",
    "options": [
      "AWS Well-Architected Framework",
      "AWS Budgets",
      "AWS Pricing Calculator",
      "AWS Cloud Adoption Framework (AWS CAF)"
    ],
    "answer": "D"
  },
  {
    "id": "clf-sim03-42",
    "q": "Uma empresa configurou uma VPC na AWS. A empresa precisa de uma conexão dedicada entre a VPC e a rede on-premises da empresa. Qual ação a empresa deve tomar para atender a esse requisito?",
    "options": [
      "Anexar um internet gateway ao VPC. Usar os endpoints públicos da AWS para conectividade.",
      "Configurar o Amazon Connect para fornecer conectividade entre o VPC e a rede on-premises da empresa.",
      "Estabelecer uma conexão VPN entre a VPC e a rede on-premises da empresa.",
      "Estabelecer uma conexão AWS Direct Connect entre a VPC e a rede on-premises da empresa."
    ],
    "answer": "D"
  },
  {
    "id": "clf-sim03-43",
    "topic": "Responsabilidade compartilhada",
    "q": "Qual aspecto de segurança é responsabilidade do cliente, de acordo com o modelo de responsabilidade compartilhada da AWS?",
    "options": [
      "Controles físicos e ambientais",
      "Conscientização e treinamento",
      "Gerenciamento de patches e configuração",
      "Proteção de serviços e comunicações ou segurança de zona"
    ],
    "answer": "C",
    "note": "Revisar gabarito: o simulado marca C; a documentação da AWS sugere D. Na documentação da AWS, patches e configuração são controles compartilhados. O controle só do cliente é Proteção de serviços e comunicações ou segurança de zona."
  },
  {
    "id": "clf-sim03-44",
    "topic": "Computação",
    "q": "Uma empresa processa informações de identificação pessoal (PII) e deve manter os dados no país onde foram gerados. A empresa quer usar instâncias do Amazon EC2 para essas cargas de trabalho. Qual serviço da AWS atenderá a esses requisitos?",
    "options": [
      "AWS Storage Gateway",
      "AWS DataSync",
      "AWS OpsWorks",
      "AWS Outposts"
    ],
    "answer": "D"
  },
  {
    "id": "clf-sim03-45",
    "topic": "Computação",
    "q": "Qual tarefa a AWS executa automaticamente?",
    "options": [
      "Aplicar patches em instâncias do Amazon EC2.",
      "Criar certificados TLS para os sites dos usuários.",
      "Criptografar o tráfego de rede do usuário.",
      "Criptografar dados armazenados no Amazon DynamoDB."
    ],
    "answer": "A",
    "note": "Revisar gabarito: o simulado marca A; a documentação da AWS sugere D. Aplicar patches no EC2 é do cliente (a própria questão 59 trata assim). A AWS criptografa automaticamente os dados em repouso no DynamoDB."
  },
  {
    "id": "clf-sim03-46",
    "topic": "Computação",
    "q": "Uma empresa precisa de um relatório histórico sobre como suas instâncias do Amazon EC2 foram modificadas no mês passado. Qual serviço da AWS pode ser usado para atender a essa necessidade?",
    "options": [
      "Amazon CloudWatch",
      "AWS Config",
      "AWS Artifact",
      "AWS Service Catalog"
    ],
    "answer": "B"
  },
  {
    "id": "clf-sim03-47",
    "topic": "Proteção de dados",
    "q": "Qual serviço ou recurso da AWS permite que os usuários criptografem dados em repouso no Amazon S3?",
    "options": [
      "Criptografia do lado do cliente",
      "Amazon GuardDuty",
      "Políticas do IAM",
      "Criptografia do lado do servidor"
    ],
    "answer": "D"
  },
  {
    "id": "clf-sim03-48",
    "topic": "IAM e identidade",
    "q": "Quais tarefas são responsabilidade do cliente, de acordo com o modelo de responsabilidade compartilhada da AWS? (Selecione DUAS.)",
    "options": [
      "Manter controle de acesso físico em uma Região da AWS.",
      "Atualizar o firmware da infraestrutura de rede.",
      "Aplicar patch no sistema operacional do Amazon RDS.",
      "Conceder acesso de menor privilégio aos usuários do IAM.",
      "Gerenciar a criptografia de dados."
    ],
    "answer": [
      "D",
      "E"
    ]
  },
  {
    "id": "clf-sim03-49",
    "topic": "Suporte e parceiros",
    "q": "Uma empresa está migrando seu data center para a AWS. A empresa precisa de um plano de suporte da AWS que forneça acesso via chat a um engenheiro de suporte em nuvem 24 horas por dia, 7 dias por semana. A empresa não precisa de acesso ao gerenciamento de eventos de infraestrutura. Qual é o plano de suporte da AWS mais econômico que atende a esses requisitos?",
    "options": [
      "AWS Business Support",
      "AWS Enterprise Support",
      "AWS Developer Support",
      "AWS Basic Support"
    ],
    "answer": "A"
  },
  {
    "id": "clf-sim03-50",
    "topic": "Computação",
    "q": "Uma empresa de varejo migrou recentemente seu site para a AWS. A empresa quer garantir que ele esteja protegido contra ataques de injeção de SQL. O site usa um Application Load Balancer para distribuir o tráfego para várias instâncias do Amazon EC2. Qual serviço ou recurso da AWS pode ser usado para criar uma regra personalizada que bloqueie ataques de injeção de SQL?",
    "options": [
      "Grupos de segurança",
      "AWS Shield",
      "AWS WAF",
      "ACLs de rede"
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim03-51",
    "topic": "IAM e identidade",
    "q": "Qual tarefa deve ser realizada por um usuário usando as credenciais do usuário root da conta da AWS?",
    "options": [
      "Fazer alterações nos recursos de produção da AWS.",
      "Acessar os Relatórios de Custos e Uso da AWS.",
      "Conceder aos auditores acesso a uma conta da AWS para uma auditoria de conformidade.",
      "Mudar planos de suporte da AWS."
    ],
    "answer": "D"
  },
  {
    "id": "clf-sim03-52",
    "topic": "Infraestrutura global",
    "q": "Uma empresa quer migrar sua aplicação de computação de alto desempenho (HPC) para instâncias do Amazon EC2. A aplicação possui múltiplos componentes. A aplicação deve ter tolerância a falhas e deve ser capaz de failover automático. Qual solução de infraestrutura da AWS atenderá a esses requisitos com a menor latência entre os componentes?",
    "options": [
      "Múltiplas Regiões da AWS",
      "Múltiplas Zonas de Disponibilidade",
      "Caches de borda regionais",
      "Múltiplas localizações de borda"
    ],
    "answer": "B"
  },
  {
    "id": "clf-sim03-53",
    "topic": "Governança e auditoria",
    "q": "Uma empresa está construindo uma aplicação na AWS. A aplicação precisa cumprir com os requisitos regulatórios de cartões de crédito. A empresa precisa de prova de que os serviços da AWS e a implantação estão em conformidade. Quais ações a empresa deve tomar para atender a esses requisitos? (Selecione DUAS.)",
    "options": [
      "Garantir que os componentes de hardware subjacentes do aplicativo estejam em conformidade com os requisitos.",
      "Usar o Amazon Inspector para enviar a aplicação para certificação.",
      "Obter a conformidade do aplicativo certificada por um avaliador da empresa.",
      "Usar o AWS Security Hub para certificar a conformidade do aplicativo.",
      "Usar AWS Artifact para acessar documentos da AWS sobre a conformidade dos serviços."
    ],
    "answer": [
      "C",
      "E"
    ]
  },
  {
    "id": "clf-sim03-54",
    "q": "Quais serviços da AWS são serviços de conectividade para uma VPC? (Selecione DOIS.)",
    "options": [
      "AWS Site-to-Site VPN",
      "AWS Key Management Service (AWS KMS)",
      "Amazon Connect",
      "AWS Direct Connect"
    ],
    "answer": [
      "A",
      "D"
    ]
  },
  {
    "id": "clf-sim03-55",
    "topic": "Gestão de custos",
    "q": "Uma empresa precisa definir um limite máximo de gastos nos serviços da AWS a cada mês. A empresa também precisa configurar alertas para quando atingir seu limite de gastos. Qual serviço ou ferramenta da AWS a empresa deve usar para atender a esses requisitos?",
    "options": [
      "Cost Explorer",
      "AWS Budgets",
      "Cotas de Serviço",
      "AWS Trusted Advisor"
    ],
    "answer": "B"
  },
  {
    "id": "clf-sim03-56",
    "topic": "Gestão de custos",
    "q": "Uma empresa quer migrar suas aplicações baseadas em servidores para a AWS Cloud. A empresa quer determinar o custo total de propriedade para seus recursos de computação que serão hospedados na AWS Cloud. Qual combinação de serviços ou ferramentas da AWS atenderá a esses requisitos?",
    "options": [
      "AWS Support Center",
      "Migration Evaluator",
      "AWS Application Discovery Service",
      "AWS Pricing Calculator",
      "AWS Database Migration Service (AWS DMS)"
    ],
    "answer": [
      "C",
      "D"
    ]
  },
  {
    "id": "clf-sim03-57",
    "topic": "Governança e auditoria",
    "q": "Qual serviço ou ferramenta da AWS oferece faturamento consolidado?",
    "options": [
      "AWS Artifact",
      "AWS Budgets",
      "AWS Organizations",
      "AWS Trusted Advisor"
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim03-58",
    "topic": "Computação",
    "q": "Uma empresa está executando uma instância do Amazon EC2 em uma VPC. Uma empresa de comércio eletrônico está usando grupos do Amazon EC2 Auto Scaling para gerenciar uma frota de servidores web executando no Amazon EC2. Esta arquitetura segue qual prática recomendada do AWS Well-Architected Framework?",
    "options": [
      "Pensar em paralelo",
      "Desacoplar componentes de infraestrutura",
      "Proteger a carga de trabalho",
      "Desenhar para falha"
    ],
    "answer": "D"
  },
  {
    "id": "clf-sim03-59",
    "topic": "Responsabilidade compartilhada",
    "q": "De acordo com o modelo de responsabilidade compartilhada da AWS, qual tarefa é responsabilidade do cliente?",
    "options": [
      "Manutenção da infraestrutura do Amazon S3",
      "Atualização do sistema operacional convidado em instâncias do Amazon EC2",
      "Manter a infraestrutura necessária para executar o AWS Lambda",
      "Atualização do sistema operacional das instâncias do Amazon DynamoDB"
    ],
    "answer": "B"
  },
  {
    "id": "clf-sim03-60",
    "topic": "Migração e CAF",
    "q": "Uma empresa quer migrar sua aplicação on-premises para a AWS Cloud. A empresa é legalmente obrigada a reter certos dados em seu data center on-premises. Qual serviço ou recurso da AWS suportará esse requisito?",
    "options": [
      "AWS Local Zones",
      "AWS Wavelength",
      "AWS Outposts",
      "VMware Cloud on AWS"
    ],
    "answer": "C"
  },
  {
    "id": "clf-sim03-61",
    "q": "Uma empresa migrou sua aplicação principal para múltiplas cargas de trabalho na AWS Cloud. A empresa quer melhorar a confiabilidade da aplicação. Qual princípio de design em nuvem a empresa deve implementar para alcançar esse objetivo?",
    "options": [
      "Maximizar a utilização.",
      "Dimensionar corretamente os recursos.",
      "Adotar um modelo de consumo.",
      "Desacoplar os componentes."
    ],
    "answer": "D"
  },
  {
    "id": "clf-sim03-62",
    "topic": "IA e machine learning",
    "q": "Uma empresa tem um bucket do Amazon S3 contendo imagens de faturas financeiras escaneadas. A empresa está construindo uma aplicação baseada em inteligência artificial (IA) na AWS. A empresa quer que a aplicação identifique e leia os valores totais das faturas. Qual serviço da AWS atenderá a esses requisitos?",
    "options": [
      "Amazon Forecast",
      "Amazon Rekognition",
      "Amazon Lex",
      "Amazon Textract"
    ],
    "answer": "D"
  },
  {
    "id": "clf-sim03-63",
    "topic": "Detecção de ameaças e vulnerabilidades",
    "q": "Qual serviço da AWS oferece proteção contra ataques DDoS para aplicações que rodam na AWS Cloud?",
    "options": [
      "AWS Shield",
      "Amazon VPC",
      "AWS Config",
      "AWS Audit Manager"
    ],
    "answer": "A"
  },
  {
    "id": "clf-sim03-64",
    "q": "Quais serviços da AWS podem limitar erros manuais provisionando consistentemente recursos da AWS em múltiplos ambientes?",
    "options": [
      "AWS CloudFormation",
      "AWS CodeStar",
      "AWS CodeBuild",
      "AWS Config",
      "AWS Cloud Development Kit (AWS CDK)"
    ],
    "answer": [
      "A",
      "E"
    ]
  },
  {
    "id": "clf-sim03-65",
    "topic": "Infraestrutura global",
    "q": "Uma empresa implantou uma aplicação na AWS Cloud. A empresa quer garantir que a aplicação seja altamente resiliente. Qual componente da infraestrutura da AWS a empresa pode usar para atender a esse requisito?",
    "options": [
      "Zonas de Disponibilidade",
      "Rede de entrega de conteúdo (CDN)",
      "Zonas Wavelength",
      "Localizações de borda"
    ],
    "answer": "A"
  },
];

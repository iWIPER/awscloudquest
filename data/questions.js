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
    topic: "Segurança",
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
    topic: "Redes",
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
    topic: "Auditoria",
    q: "Uma auditoria precisa saber qual usuário apagou um bucket do S3, quando e de qual endereço IP. Qual serviço registra essas chamadas de API na conta?",
    options: ["Amazon CloudWatch", "AWS CloudTrail", "AWS Config", "Amazon Inspector"],
    answer: "B",
    explanation: "O AWS CloudTrail registra as ações feitas na conta (quem, quando, de onde e com quais parâmetros). O CloudWatch cuida de métricas e logs de aplicações, o Config registra o estado da configuração dos recursos, e o Inspector procura vulnerabilidades.",
  },
  {
    id: "spot-batch-cost",
    topic: "Custos",
    q: "Um processamento em lote é tolerante a falhas, pode ser interrompido e retomado a qualquer momento e não tem previsão de uso contínuo. Qual opção de compra do EC2 costuma ter o MENOR custo para esse caso?",
    options: ["Instâncias sob demanda", "Instâncias reservadas", "Instâncias spot", "Hosts dedicados"],
    answer: "C",
    explanation: "Instâncias spot usam capacidade ociosa com grandes descontos sobre o preço sob demanda, mas podem ser interrompidas pela AWS, o que é aceitável para cargas tolerantes a falhas. Instâncias reservadas exigem compromisso de uso, e hosts dedicados são a opção mais cara.",
  },
  {
    "id": "clf-sim01-03",
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
];

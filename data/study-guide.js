/*
 * AWS Cloud Quest — study guide
 * =============================
 * Areas used by the end-of-game report ("Desempenho por área").
 *
 *   domains  the four domains of the AWS Certified Cloud Practitioner (CLF-C02) exam
 *   topics   sub-areas; every question in data/questions.js must use one of these
 *            names in its `topic` field (CI checks it)
 *
 * Each topic lists what to study when the player does badly in it, plus
 * official AWS links. Text is shown to players, so it is in Portuguese.
 */
window.STUDY_GUIDE = {
  exam: {
    name: "AWS Certified Cloud Practitioner (CLF-C02)",
    url: "https://aws.amazon.com/certification/certified-cloud-practitioner/",
  },

  domains: [
    "Conceitos de nuvem",
    "Segurança e conformidade",
    "Tecnologia e serviços de nuvem",
    "Faturamento, preços e suporte",
  ],

  topics: {
    // ── Conceitos de nuvem ─────────────────────────────────────────────
    "Benefícios da nuvem": {
      domain: "Conceitos de nuvem",
      keywords: ["elasticidade", "elástico", "escalabilidade", "agilidade", "economia de escala", "despesa de capital", "despesa variável", "despesas variáveis", "adivinhar capacidade", "benefício da nuvem", "benefícios da nuvem", "vantagem da nuvem", "proposta de valor"],
      study: [
        "As seis vantagens da computação em nuvem: trocar gasto fixo por variável, economia de escala, parar de adivinhar capacidade, velocidade e agilidade, não gastar com data center, alcance global em minutos.",
        "Diferença entre elasticidade (ajustar recursos à demanda, para cima e para baixo) e escalabilidade (crescer para atender mais carga).",
        "Alta disponibilidade, tolerância a falhas e agilidade como benefícios de projetar na nuvem.",
      ],
      links: [
        { label: "Seis vantagens da computação em nuvem", url: "https://docs.aws.amazon.com/whitepapers/latest/aws-overview/six-advantages-of-cloud-computing.html" },
      ],
    },
    "Well-Architected": {
      domain: "Conceitos de nuvem",
      keywords: ["well-architected", "pilar", "pilares", "excelência operacional", "eficiência de performance", "eficiência de desempenho", "sustentabilidade", "pegada de carbono", "impacto ambiental", "operar de forma mais eficiente"],
      study: [
        "Os seis pilares: excelência operacional, segurança, confiabilidade, eficiência de performance, otimização de custos e sustentabilidade.",
        "Qual pilar responde a cada tipo de pergunta (ex.: monitorar e melhorar processos é excelência operacional; dimensionamento correto é otimização de custos).",
        "Ferramentas ligadas aos pilares, como a ferramenta de pegada de carbono (sustentabilidade).",
      ],
      links: [
        { label: "AWS Well-Architected", url: "https://aws.amazon.com/architecture/well-architected/" },
        { label: "Ferramenta de pegada de carbono", url: "https://aws.amazon.com/aws-cost-management/aws-customer-carbon-footprint-tool/" },
      ],
    },
    "Migração e CAF": {
      domain: "Conceitos de nuvem",
      keywords: ["cloud adoption framework", "caf", "perspectiva", "migração", "migrar", "migrações", "snowball", "snowmobile", "snowcone", "snow family", "família snow", "migration hub", "application migration service", "database migration service", "dms", "datasync", "transfer family", "rehost", "replatform", "refactor", "gerenciamento de benefícios", "petabytes"],
      study: [
        "AWS Cloud Adoption Framework: as seis perspectivas (Negócios, Pessoas, Governança, Plataforma, Segurança, Operações) e as capacidades de cada uma.",
        "Família AWS Snow para mover dados offline, como o Snowball Edge. Snowcone e Snowmobile foram descontinuados pela AWS, mas ainda aparecem em questões: saiba que o Snowmobile servia para dezenas de petabytes.",
        "AWS Migration Hub para acompanhar migrações e as estratégias de migração (rehost, replatform, refactor e outras).",
      ],
      links: [
        { label: "AWS Cloud Adoption Framework", url: "https://aws.amazon.com/cloud-adoption-framework/" },
        { label: "Família AWS Snow", url: "https://aws.amazon.com/snow/" },
        { label: "AWS Migration Hub", url: "https://aws.amazon.com/migration-hub/" },
      ],
    },

    // ── Segurança e conformidade ───────────────────────────────────────
    "Responsabilidade compartilhada": {
      domain: "Segurança e conformidade",
      keywords: ["responsabilidade compartilhada", "responsabilidade do cliente", "responsável pela", "responsabilidades", "patches", "aplicação de patches", "sistema operacional", "segurança da nuvem", "segurança na nuvem", "otimização de aplicações", "segurança de dados da aplicação"],
      study: [
        "A AWS cuida da segurança DA nuvem (hardware, data centers, rede física, virtualização); o cliente cuida da segurança NA nuvem (dados, identidades, configurações).",
        "Como a divisão muda por tipo de serviço: no EC2 o cliente aplica patches no sistema operacional; em serviços gerenciados (RDS, Lambda) a AWS assume mais tarefas.",
        "Tarefas que são sempre do cliente, como proteger os dados da aplicação e gerenciar acessos.",
      ],
      links: [
        { label: "Modelo de responsabilidade compartilhada", url: "https://aws.amazon.com/compliance/shared-responsibility-model/" },
      ],
    },
    "IAM e identidade": {
      domain: "Segurança e conformidade",
      keywords: ["iam", "usuário root", "usuário raiz", "root", "mfa", "autenticação multifator", "multifator", "credenciais", "relatório de credenciais", "chaves de acesso", "sts", "security token service", "credenciais temporárias", "cognito", "identity center", "login", "autenticação", "permissões", "menor privilégio", "função do iam", "funções do iam", "usuários"],
      study: [
        "Usuário-raiz: ativar MFA, não usar no dia a dia e conhecer as tarefas que só ele pode fazer (ex.: mudar o plano de suporte).",
        "Usuários, grupos, funções (roles) e políticas do IAM; princípio do menor privilégio.",
        "Relatório de credenciais do IAM (MFA e chaves de acesso de todos os usuários) e credenciais temporárias com o AWS STS.",
        "Amazon Cognito para login de usuários de aplicativos (direto ou com provedores externos).",
      ],
      links: [
        { label: "Boas práticas do IAM", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html" },
        { label: "Tarefas que exigem o usuário-raiz", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/root-user-tasks.html" },
        { label: "Relatório de credenciais", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_getting-report.html" },
        { label: "AWS STS", url: "https://docs.aws.amazon.com/STS/latest/APIReference/welcome.html" },
        { label: "Amazon Cognito", url: "https://aws.amazon.com/cognito/" },
      ],
    },
    "Proteção de dados": {
      domain: "Segurança e conformidade",
      keywords: ["criptografia", "criptografar", "kms", "key management service", "cloudhsm", "macie", "dados sensíveis", "aws backup", "backup", "proteção de dados", "certificate manager", "secrets manager", "acls", "acl", "bucket policy", "política de bucket"],
      study: [
        "Criptografia em repouso e em trânsito; AWS KMS para criar e gerenciar chaves usadas por EBS, RDS, S3 e outros.",
        "Amazon Macie para descobrir dados sensíveis no Amazon S3.",
        "AWS Backup para uma política central de backup entre serviços.",
        "Controle de acesso a buckets do S3: políticas de bucket e IAM (recomendado) e ACLs.",
      ],
      links: [
        { label: "AWS KMS", url: "https://aws.amazon.com/kms/" },
        { label: "Amazon Macie", url: "https://aws.amazon.com/macie/" },
        { label: "AWS Backup", url: "https://aws.amazon.com/backup/" },
      ],
    },
    "Detecção de ameaças e vulnerabilidades": {
      domain: "Segurança e conformidade",
      keywords: ["inspector", "guardduty", "vulnerabilidade", "vulnerabilidades", "ameaça", "ameaças", "shield", "ddos", "waf", "detective", "security hub", "firewall manager", "atividade maliciosa"],
      study: [
        "Amazon Inspector: varredura automática e contínua de vulnerabilidades em EC2, imagens de contêiner e Lambda.",
        "Amazon GuardDuty: detecção de ameaças analisando logs e atividade da conta.",
        "A diferença entre encontrar vulnerabilidades (Inspector), detectar ameaças (GuardDuty) e proteger contra DDoS (Shield).",
      ],
      links: [
        { label: "Amazon Inspector", url: "https://aws.amazon.com/inspector/" },
        { label: "Amazon GuardDuty", url: "https://aws.amazon.com/guardduty/" },
      ],
    },
    "Governança e auditoria": {
      domain: "Segurança e conformidade",
      keywords: ["cloudtrail", "chamadas de api", "chamada de api", "auditoria", "auditar", "organizations", "várias contas", "unidade de negócios", "scp", "políticas de controle de serviço", "artifact", "conformidade", "relatórios de segurança", "iso", "soc", "aws config", "control tower", "landing zone", "guardrails", "encerrada", "quem fez"],
      study: [
        "AWS CloudTrail: registra quem fez cada chamada de API, quando e de onde (auditoria).",
        "AWS Organizations: várias contas (ex.: uma por unidade de negócio), políticas de controle de serviço (SCPs) e faturamento consolidado.",
        "AWS Artifact: relatórios de conformidade da AWS (ISO, SOC, PCI) sob demanda.",
      ],
      links: [
        { label: "AWS CloudTrail", url: "https://aws.amazon.com/cloudtrail/" },
        { label: "AWS Organizations", url: "https://aws.amazon.com/organizations/" },
        { label: "AWS Artifact", url: "https://aws.amazon.com/artifact/" },
      ],
    },
    "Segurança de rede": {
      domain: "Segurança e conformidade",
      keywords: ["security group", "security groups", "grupo de segurança", "grupos de segurança", "network acl", "network acls", "acl de rede", "nacl", "regras de segurança", "stateful", "stateless", "firewall", "sub rede"],
      study: [
        "Security groups: firewall da instância, só regras de permissão, stateful.",
        "Network ACLs: firewall da sub-rede, regras de permissão e de negação, stateless e avaliadas em ordem numérica.",
        "Quando usar cada um e como eles trabalham juntos numa VPC.",
      ],
      links: [
        { label: "Security groups", url: "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html" },
        { label: "Network ACLs", url: "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html" },
      ],
    },

    // ── Tecnologia e serviços de nuvem ─────────────────────────────────
    "Computação": {
      domain: "Tecnologia e serviços de nuvem",
      keywords: ["ec2", "instância", "instâncias", "lambda", "sem servidor", "serverless", "executa código", "elastic beanstalk", "beanstalk", "auto scaling", "lightsail", "aws batch", "ecs", "eks", "fargate", "contêiner", "workspaces", "desktops virtuais", "compute optimizer", "dimensionamento"],
      study: [
        "Amazon EC2 e seus tipos de instância; EC2 Auto Scaling para ajustar a quantidade de instâncias à demanda.",
        "AWS Lambda (sem servidor, cobrado por requisição e duração) e AWS Elastic Beanstalk (implantar aplicações sem gerenciar a infraestrutura).",
        "Amazon WorkSpaces para desktops virtuais e o AWS Compute Optimizer para recomendações de tamanho.",
      ],
      links: [
        { label: "Amazon EC2", url: "https://aws.amazon.com/ec2/" },
        { label: "Amazon EC2 Auto Scaling", url: "https://aws.amazon.com/ec2/autoscaling/" },
        { label: "AWS Lambda", url: "https://aws.amazon.com/lambda/" },
        { label: "AWS Elastic Beanstalk", url: "https://aws.amazon.com/elasticbeanstalk/" },
        { label: "Amazon WorkSpaces", url: "https://aws.amazon.com/workspaces/" },
      ],
    },
    "Armazenamento": {
      domain: "Tecnologia e serviços de nuvem",
      keywords: ["s3", "glacier", "deep archive", "classe de armazenamento", "classes de armazenamento", "armazenamento de objetos", "ebs", "elastic block store", "efs", "fsx", "storage gateway", "ciclo de vida", "longo prazo", "armazenamento de arquivos"],
      study: [
        "Amazon S3 (objetos), Amazon EBS (blocos, para EC2) e Amazon EFS (arquivos compartilhados).",
        "Classes de armazenamento do S3, do Standard ao Glacier Deep Archive, e regras de ciclo de vida para mover dados automaticamente.",
        "Custo, durabilidade e tempo de recuperação de cada classe.",
      ],
      links: [
        { label: "Classes de armazenamento do S3", url: "https://aws.amazon.com/s3/storage-classes/" },
      ],
    },
    "Banco de dados": {
      domain: "Tecnologia e serviços de nuvem",
      keywords: ["banco de dados", "rds", "aurora", "dynamodb", "neptune", "timestream", "documentdb", "elasticache", "mysql", "postgresql", "nosql", "multi az", "gráfico", "séries temporais", "chave valor"],
      study: [
        "Relacionais: Amazon RDS e Aurora; Multi-AZ para alta disponibilidade.",
        "NoSQL e propósito específico: DynamoDB (chave-valor), Neptune (grafos), Timestream (séries temporais).",
        "Redshift como data warehouse para análises.",
      ],
      links: [
        { label: "Bancos de dados na AWS", url: "https://aws.amazon.com/products/databases/" },
        { label: "Amazon RDS Multi-AZ", url: "https://aws.amazon.com/rds/features/multi-az/" },
      ],
    },
    "Infraestrutura global": {
      domain: "Tecnologia e serviços de nuvem",
      keywords: ["região", "regiões", "multi região", "zona de disponibilidade", "zonas de disponibilidade", "availability zone", "edge", "ponto de presença", "pontos de presença", "local zones", "cloudfront", "global accelerator", "latência", "globalmente", "área geográfica", "continente", "fontes de energia", "confiável", "disponibilidade"],
      study: [
        "Regiões, Zonas de Disponibilidade e pontos de presença (edge locations).",
        "Usar várias Zonas de Disponibilidade para alta disponibilidade e várias Regiões para alcance global e menor latência.",
        "Como escolher uma Região (latência para os clientes, conformidade, serviços disponíveis, preço).",
      ],
      links: [
        { label: "Infraestrutura global da AWS", url: "https://aws.amazon.com/about-aws/global-infrastructure/" },
      ],
    },
    "Análise de dados": {
      domain: "Tecnologia e serviços de nuvem",
      keywords: ["athena", "kinesis", "firehose", "glue", "quicksight", "emr", "redshift", "data warehouse", "streaming", "consultas", "análise", "análises", "opensearch"],
      study: [
        "Amazon Athena: consultas SQL direto em dados no S3, sem servidor.",
        "Amazon Data Firehose (antigo Kinesis Data Firehose): captura e entrega de dados de streaming para S3 e outros destinos.",
        "Onde entram Redshift, Glue e QuickSight num fluxo de análise.",
      ],
      links: [
        { label: "Amazon Athena", url: "https://aws.amazon.com/athena/" },
        { label: "Amazon Data Firehose", url: "https://aws.amazon.com/kinesis/data-firehose/" },
      ],
    },
    "IA e machine learning": {
      domain: "Tecnologia e serviços de nuvem",
      keywords: ["personalize", "kendra", "sagemaker", "comprehend", "rekognition", "polly", "transcribe", "translate", "lex", "textract", "bedrock", "aprendizado de máquina", "machine learning", "ml", "recomendações de produtos", "recomendar produtos", "procurar texto"],
      study: [
        "Serviços de IA prontos: Amazon Personalize (recomendações), Amazon Kendra (busca em documentos), Comprehend (texto), Rekognition (imagens).",
        "Amazon SageMaker para criar e treinar modelos próprios, e quando um serviço pronto basta.",
      ],
      links: [
        { label: "Amazon Personalize", url: "https://aws.amazon.com/personalize/" },
        { label: "Amazon Kendra", url: "https://aws.amazon.com/kendra/" },
      ],
    },

    // ── Faturamento, preços e suporte ──────────────────────────────────
    "Preços e compras": {
      domain: "Faturamento, preços e suporte",
      keywords: ["spot", "sob demanda", "instâncias reservadas", "reservadas", "savings plans", "hosts dedicados", "opção de compra", "opções de compra", "preço", "nível gratuito", "free tier"],
      study: [
        "Opções de compra do EC2: sob demanda, instâncias reservadas, Savings Plans, spot e hosts dedicados.",
        "Qual opção combina com cada tipo de carga (ex.: spot para trabalhos tolerantes a interrupção).",
      ],
      links: [
        { label: "Preços do Amazon EC2", url: "https://aws.amazon.com/ec2/pricing/" },
      ],
    },
    "Gestão de custos": {
      domain: "Faturamento, preços e suporte",
      keywords: ["custo", "custos", "cost explorer", "budgets", "orçamento", "tags de alocação", "alocação de custos", "calculadora de preços", "pricing calculator", "faturamento consolidado", "cost and usage", "dimensionamento correto", "right sizing", "mais econômica"],
      study: [
        "Tags de alocação de custos para separar gastos por projeto ou área.",
        "AWS Cost Explorer, AWS Budgets e a Calculadora de Preços.",
        "Dimensionamento correto (right sizing) para não pagar por capacidade ociosa.",
      ],
      links: [
        { label: "Gestão de custos na AWS", url: "https://aws.amazon.com/aws-cost-management/" },
        { label: "Tags de alocação de custos", url: "https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/cost-alloc-tags.html" },
      ],
    },
    "Suporte e parceiros": {
      domain: "Faturamento, preços e suporte",
      keywords: ["suporte", "support", "plano de suporte", "enterprise support", "tam", "gerente de conta técnica", "concierge", "trusted advisor", "partner network", "apn", "parceiros", "consultores", "terceirizados", "marketplace", "professional services", "re post", "faturamento e contas"],
      study: [
        "Planos de suporte (Basic, Developer, Business, Enterprise On-Ramp, Enterprise) e o que cada um inclui: TAM, equipe Concierge, Trusted Advisor completo.",
        "AWS Partner Network (APN) para contratar consultorias e parceiros certificados.",
      ],
      links: [
        { label: "Planos de suporte", url: "https://aws.amazon.com/premiumsupport/plans/" },
        { label: "AWS Partner Network", url: "https://aws.amazon.com/partners/" },
      ],
    },
  },
};

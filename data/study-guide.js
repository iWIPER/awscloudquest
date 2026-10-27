/*
 * AWS Cloud Quest — study guide
 * =============================
 * Areas used by the end-of-game report ("Desempenho por área").
 *
 *   domains  the four domains of the AWS Certified Cloud Practitioner (CLF-C02) exam
 *   weights  each domain's share of the scored exam (official exam guide)
 *   tasks    the exam guide's task statements ("2.3"), translated
 *   topics   sub-areas, each tied to one task statement; every question in
 *            data/questions.js must use one of these names in its `topic`
 *            field (CI checks it)
 *
 * Source: https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02.html
 *
 * Each topic lists what to study when the player does badly in it, official
 * AWS links, and the study hint of the easy mode: memory tricks (`tips`) and a
 * mini mind map of services (`map`: [service, what it does]). Text is shown to
 * players, so it is in Portuguese.
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

  weights: {
    "Conceitos de nuvem": 24,
    "Segurança e conformidade": 30,
    "Tecnologia e serviços de nuvem": 34,
    "Faturamento, preços e suporte": 12,
  },

  tasks: {
    "1.1": "Benefícios da Nuvem AWS",
    "1.2": "Princípios de design da Nuvem AWS",
    "1.3": "Migração para a Nuvem AWS",
    "1.4": "Economia da nuvem",
    "2.1": "Modelo de responsabilidade compartilhada",
    "2.2": "Segurança, governança e conformidade",
    "2.3": "Gerenciamento de acesso",
    "2.4": "Componentes e recursos de segurança",
    "3.1": "Implantar e operar na Nuvem AWS",
    "3.2": "Infraestrutura global",
    "3.3": "Serviços de computação",
    "3.4": "Serviços de banco de dados",
    "3.5": "Serviços de rede",
    "3.6": "Serviços de armazenamento",
    "3.7": "IA/ML e análise de dados",
    "3.8": "Outras categorias de serviços",
    "4.1": "Modelos de preço",
    "4.2": "Faturamento, orçamento e custos",
    "4.3": "Recursos técnicos e suporte",
  },

  topics: {
    // ── Conceitos de nuvem ─────────────────────────────────────────────
    "Benefícios da nuvem": {
      domain: "Conceitos de nuvem",
      task: "1.1",
      tips: [
        "Pense em gasto Variável, Agilidade, Economia de escala e alcance Global em minutos.",
        "Elasticidade = cresce e encolhe sozinho conforme a demanda. Escalabilidade = aguenta crescer.",
      ],
      map: [
        ["Elasticidade", "ajustar recursos à demanda, para cima e para baixo"],
        ["Agilidade", "criar recursos em minutos e testar rápido"],
        ["Economia de escala", "preço menor porque a AWS compra em volume"],
        ["Alta disponibilidade", "continuar no ar com falhas, usando várias zonas"],
      ],
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
      task: "1.2",
      tips: [
        "Seis pilares: Excelência operacional, Segurança, Confiabilidade, Eficiência de performance, Otimização de custos e Sustentabilidade.",
        "Desacoplar = peças independentes que conversam por filas ou mensagens: uma falha não derruba as outras.",
      ],
      map: [
        ["Excelência operacional", "automatizar e melhorar processos"],
        ["Confiabilidade", "recuperar de falhas e escalar"],
        ["Eficiência de performance", "usar o recurso certo do jeito certo"],
        ["Otimização de custos", "pagar só pelo que precisa"],
        ["Sustentabilidade", "reduzir o impacto ambiental"],
      ],
      keywords: ["well-architected", "pilar", "pilares", "excelência operacional", "eficiência de performance", "eficiência de desempenho", "sustentabilidade", "pegada de carbono", "impacto ambiental", "operar de forma mais eficiente", "desacoplar", "desacoplado", "desacoplamento", "fracamente acoplados", "acoplamento", "princípio de design", "princípios de design"],
      study: [
        "Os seis pilares: excelência operacional, segurança, confiabilidade, eficiência de performance, otimização de custos e sustentabilidade.",
        "Qual pilar responde a cada tipo de pergunta (ex.: monitorar e melhorar processos é excelência operacional; dimensionamento correto é otimização de custos).",
        "Ferramentas ligadas aos pilares, como a ferramenta de pegada de carbono (sustentabilidade).",
        "Princípios de design: componentes fracamente acoplados (desacoplar com filas e mensagens) para atualizar e escalar cada parte de forma independente.",
      ],
      links: [
        { label: "AWS Well-Architected", url: "https://aws.amazon.com/architecture/well-architected/" },
        { label: "Ferramenta de pegada de carbono", url: "https://aws.amazon.com/aws-cost-management/aws-customer-carbon-footprint-tool/" },
      ],
    },
    "Migração e CAF": {
      domain: "Conceitos de nuvem",
      task: "1.3",
      tips: [
        "O CAF tem 6 perspectivas: 3 de negócio (Negócios, Pessoas, Governança) e 3 técnicas (Plataforma, Segurança, Operações).",
        "Família Snow = levar dados \"de caminhão\": muitos terabytes sem depender da internet.",
      ],
      map: [
        ["AWS DMS", "migrar bancos de dados com pouca parada"],
        ["AWS Snowball", "dispositivo físico para mover muitos dados"],
        ["AWS DataSync", "transferir arquivos pela rede para a AWS"],
        ["AWS Application Migration Service", "levar servidores como estão (rehost)"],
      ],
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
      task: "2.1",
      tips: [
        "A AWS cuida da segurança DA nuvem (prédios, hardware, rede física). Você cuida da segurança NA nuvem (dados, acessos, configurações).",
        "Quanto mais gerenciado o serviço (Lambda, RDS), menos fica com você. No EC2, o sistema operacional e os patches dele são seus.",
      ],
      map: [
        ["AWS", "data centers, hardware, virtualização"],
        ["Cliente", "dados, usuários e permissões, security groups, criptografia"],
        ["Compartilhado", "patches, configuração, treinamento (cada um na sua parte)"],
      ],
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
      task: "2.3",
      tips: [
        "Usuário root só para tarefas raras: proteja com MFA e não crie chaves de acesso para ele.",
        "Menor privilégio: só a permissão necessária. Grupo junta usuários; função (role) dá permissão temporária.",
      ],
      map: [
        ["AWS IAM", "usuários, grupos, funções e políticas"],
        ["MFA", "segundo fator no login"],
        ["IAM Identity Center", "login único em várias contas"],
        ["Amazon Cognito", "login dos usuários do seu aplicativo"],
        ["AWS Secrets Manager", "guardar e girar senhas e chaves"],
      ],
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
      task: "2.2",
      tips: [
        "Criptografia em repouso (dados guardados) e em trânsito (dados viajando, com TLS).",
        "KMS = chaves gerenciadas pela AWS; CloudHSM = hardware dedicado só seu; Macie = acha dados sensíveis no S3.",
      ],
      map: [
        ["AWS KMS", "criar e controlar chaves de criptografia"],
        ["AWS CloudHSM", "módulo de hardware dedicado"],
        ["Amazon Macie", "descobrir dados sensíveis no S3"],
        ["AWS Certificate Manager", "certificados SSL/TLS"],
        ["AWS Backup", "backups centralizados"],
      ],
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
      task: "2.4",
      tips: [
        "Inspector INSPECIONA vulnerabilidades; GuardDuty é o GUARDA que vigia ameaças; Detective INVESTIGA a causa.",
        "Shield = escudo contra DDoS; WAF = filtro de requisições web (SQL injection, XSS).",
      ],
      map: [
        ["Amazon Inspector", "vulnerabilidades em software"],
        ["Amazon GuardDuty", "detecção de ameaças pelos logs"],
        ["Amazon Detective", "investigar incidentes"],
        ["AWS Shield", "proteção contra DDoS"],
        ["AWS WAF", "firewall de aplicação web"],
        ["AWS Security Hub", "painel central de segurança"],
      ],
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
      task: "2.2",
      tips: [
        "CloudTrail = o \"rastro\": QUEM fez O QUÊ e quando (chamadas de API). Config = COMO os recursos estão configurados e o que mudou.",
        "Artifact = relatórios de conformidade (ISO, SOC, PCI). Organizations = várias contas com regras (SCPs) e uma fatura só.",
      ],
      map: [
        ["AWS CloudTrail", "auditoria de chamadas de API"],
        ["AWS Config", "histórico e regras de configuração"],
        ["Amazon CloudWatch", "métricas, logs e alarmes"],
        ["AWS Artifact", "relatórios de conformidade"],
        ["AWS Organizations", "várias contas, SCPs, faturamento consolidado"],
        ["AWS Control Tower", "landing zone com guardrails"],
      ],
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
    "Redes e VPC": {
      domain: "Tecnologia e serviços de nuvem",
      task: "3.5",
      tips: [
        "Security group = porteiro da instância: só permite e lembra a volta (stateful). Network ACL = portão da sub-rede: permite e nega, não lembra (stateless).",
        "Sub-rede pública = rota para o gateway de internet. VPN = túnel pela internet; Direct Connect = cabo dedicado.",
      ],
      map: [
        ["Amazon VPC", "sua rede isolada na AWS"],
        ["Gateway de internet", "saída da VPC para a internet"],
        ["Amazon Route 53", "DNS e roteamento de domínios"],
        ["AWS Site-to-Site VPN", "conexão criptografada pela internet"],
        ["AWS Direct Connect", "conexão física dedicada"],
      ],
      keywords: ["security group", "security groups", "grupo de segurança", "grupos de segurança", "network acl", "network acls", "acl de rede", "nacl", "regras de segurança", "stateful", "stateless", "firewall", "sub rede", "vpc", "subnet", "gateway de internet", "internet gateway", "tabela de rotas", "tabelas de rotas", "direct connect", "site to site vpn", "vpn", "conectividade", "conexão dedicada"],
      study: [
        "Security groups: firewall da instância, só regras de permissão, stateful.",
        "Network ACLs: firewall da sub-rede, regras de permissão e de negação, stateless e avaliadas em ordem numérica.",
        "Quando usar cada um e como eles trabalham juntos numa VPC.",
        "Rede na VPC: sub-rede pública = tabela de rotas com rota para um gateway de internet; conexão com o data center por AWS Site-to-Site VPN (pela internet) ou AWS Direct Connect (link dedicado).",
      ],
      links: [
        { label: "Security groups", url: "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html" },
        { label: "Network ACLs", url: "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html" },
        { label: "AWS Direct Connect", url: "https://aws.amazon.com/directconnect/" },
      ],
    },

    // ── Tecnologia e serviços de nuvem ─────────────────────────────────
    "Implantação e operação": {
      domain: "Tecnologia e serviços de nuvem",
      task: "3.1",
      tips: [
        "Console = clicando; CLI e SDK = programático (scripts e código); CloudFormation = infraestrutura como código (o mesmo ambiente sempre igual).",
        "Nuvem híbrida = parte no seu data center, parte na AWS.",
      ],
      map: [
        ["Console de Gerenciamento", "interface web"],
        ["AWS CLI", "linha de comando"],
        ["SDKs", "acesso pelo código da aplicação"],
        ["AWS CloudFormation", "modelos de infraestrutura como código"],
        ["AWS CDK", "infraestrutura como código em linguagens de programação"],
      ],
      keywords: ["cloudformation", "cdk", "cloud development kit", "infraestrutura como código", "iac", "provisionando", "provisionar", "cli", "linha de comando", "sdk", "console de gerenciamento", "modelo de implantação", "modelos de implantação", "nuvem híbrida", "híbrida", "repetível", "ambientes idênticos"],
      study: [
        "Formas de acessar a AWS: Console de Gerenciamento (cliques), AWS CLI e SDKs (programático, scripts) e infraestrutura como código.",
        "AWS CloudFormation e AWS CDK: infraestrutura como código para criar os mesmos recursos de forma repetível, em várias contas e ambientes.",
        "Modelos de implantação: nuvem, híbrido (parte no data center, parte na AWS) e on-premises.",
      ],
      links: [
        { label: "AWS CloudFormation", url: "https://aws.amazon.com/cloudformation/" },
        { label: "Opções de implantação na AWS", url: "https://docs.aws.amazon.com/whitepapers/latest/aws-overview/types-of-cloud-computing.html" },
      ],
    },
    "Integração e outros serviços": {
      domain: "Tecnologia e serviços de nuvem",
      task: "3.8",
      tips: [
        "SNS = Notifica muitos de uma vez (SMS, e-mail, outros serviços). SQS = fila: cada mensagem é processada uma vez e desacopla as partes.",
        "Connect = central de atendimento; SES = envio de e-mails; Amplify = front-end e mobile; IoT Core = dispositivos.",
      ],
      map: [
        ["Amazon SNS", "notificações pub/sub"],
        ["Amazon SQS", "filas de mensagens"],
        ["Amazon EventBridge", "barramento de eventos"],
        ["Amazon Connect", "central de atendimento"],
        ["Amazon SES", "envio de e-mails"],
        ["AWS IoT Core", "conectar dispositivos"],
      ],
      keywords: ["sns", "simple notification service", "sqs", "simple queue service", "eventbridge", "mensagens de texto", "notificações", "notificação", "fila", "filas", "ses", "simple email service", "amazon connect", "central de atendimento", "call center", "amplify", "iot", "iot core", "codepipeline", "codebuild", "x ray", "appstream"],
      study: [
        "Integração de aplicações: Amazon SNS (notificações pub/sub, inclusive SMS e e-mail), Amazon SQS (filas para desacoplar) e Amazon EventBridge (eventos).",
        "Aplicações de negócio: Amazon Connect (central de atendimento) e Amazon SES (envio de e-mails).",
        "Desenvolvedor e dispositivos: AWS CodePipeline e CodeBuild (CI/CD), AWS X-Ray (rastrear erros), AWS Amplify (front-end e mobile) e AWS IoT Core (dispositivos).",
      ],
      links: [
        { label: "Amazon SNS", url: "https://aws.amazon.com/sns/" },
        { label: "Amazon SQS", url: "https://aws.amazon.com/sqs/" },
      ],
    },
    "Computação": {
      domain: "Tecnologia e serviços de nuvem",
      task: "3.3",
      tips: [
        "EC2 = servidor virtual que você administra. Lambda = só o código, sem servidor, paga por execução.",
        "Contêineres: ECS (da AWS) ou EKS (Kubernetes); Fargate roda contêineres sem servidores para gerenciar.",
      ],
      map: [
        ["Amazon EC2", "máquinas virtuais"],
        ["AWS Lambda", "código sem servidor, por evento"],
        ["AWS Elastic Beanstalk", "subir a aplicação sem cuidar da infraestrutura"],
        ["Elastic Load Balancing", "distribuir o tráfego entre instâncias"],
        ["EC2 Auto Scaling", "mais ou menos instâncias conforme a carga"],
        ["Amazon Lightsail", "servidor simples com preço fixo"],
      ],
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
      task: "3.6",
      tips: [
        "S3 = objetos (arquivos com endereço); EBS = disco de UMA instância; EFS = pasta compartilhada por várias instâncias.",
        "Glacier = arquivo morto: quanto mais \"gelado\", mais barato e mais lento para recuperar.",
      ],
      map: [
        ["Amazon S3", "armazenamento de objetos"],
        ["Amazon EBS", "disco em bloco para o EC2"],
        ["Amazon EFS", "sistema de arquivos compartilhado"],
        ["Amazon FSx", "sistemas de arquivos Windows e Lustre"],
        ["S3 Glacier", "arquivamento de longo prazo"],
        ["AWS Storage Gateway", "ligar o ambiente local ao armazenamento da AWS"],
      ],
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
      task: "3.4",
      tips: [
        "Relacional (tabelas e SQL): RDS e Aurora. NoSQL (chave-valor, escala enorme): DynamoDB.",
        "Cache em memória: ElastiCache. Grafos: Neptune. Data warehouse para análise: Redshift.",
      ],
      map: [
        ["Amazon RDS", "bancos relacionais gerenciados"],
        ["Amazon Aurora", "relacional compatível com MySQL e PostgreSQL"],
        ["Amazon DynamoDB", "NoSQL chave-valor sem servidor"],
        ["Amazon ElastiCache", "cache em memória"],
        ["Amazon Neptune", "banco de grafos"],
        ["AWS DMS", "migrar bancos de dados"],
      ],
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
      task: "3.2",
      tips: [
        "Região = área geográfica; Zona de Disponibilidade = data centers separados dentro da Região; ponto de presença = perto do usuário.",
        "Alta disponibilidade = várias zonas. Recuperação de desastres e usuários no mundo todo = várias Regiões.",
      ],
      map: [
        ["Região", "escolhida por latência, preço, leis e serviços"],
        ["Zona de Disponibilidade", "isolamento contra falhas"],
        ["Amazon CloudFront", "CDN nos pontos de presença"],
        ["AWS Global Accelerator", "rede global da AWS para acelerar o tráfego"],
        ["AWS Outposts", "AWS dentro do seu data center"],
        ["Local Zones", "AWS perto de grandes cidades"],
      ],
      keywords: ["região", "regiões", "multi região", "zona de disponibilidade", "zonas de disponibilidade", "availability zone", "edge", "ponto de presença", "pontos de presença", "local zones", "cloudfront", "global accelerator", "latência", "globalmente", "área geográfica", "continente", "fontes de energia", "confiável", "disponibilidade", "outposts", "permaneça no local"],
      study: [
        "Regiões, Zonas de Disponibilidade e pontos de presença (edge locations).",
        "Usar várias Zonas de Disponibilidade para alta disponibilidade e várias Regiões para alcance global e menor latência.",
        "Como escolher uma Região (latência para os clientes, conformidade, serviços disponíveis, preço).",
        "AWS Outposts: infraestrutura e serviços da AWS dentro do data center do cliente, para cargas que precisam ficar no local.",
      ],
      links: [
        { label: "Infraestrutura global da AWS", url: "https://aws.amazon.com/about-aws/global-infrastructure/" },
        { label: "AWS Outposts", url: "https://aws.amazon.com/outposts/" },
      ],
    },
    "Análise de dados": {
      domain: "Tecnologia e serviços de nuvem",
      task: "3.7",
      tips: [
        "Athena = SQL direto no S3, sem servidor. Kinesis = dados em tempo real (streaming).",
        "Glue = preparar e catalogar dados (ETL). QuickSight = painéis e gráficos. Redshift = data warehouse.",
      ],
      map: [
        ["Amazon Athena", "consultas SQL no S3"],
        ["Amazon Kinesis", "streaming em tempo real"],
        ["AWS Glue", "ETL e catálogo de dados"],
        ["Amazon QuickSight", "painéis de BI"],
        ["Amazon Redshift", "data warehouse"],
        ["Amazon EMR", "big data com Spark e Hadoop"],
      ],
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
      task: "3.7",
      tips: [
        "Associe pelo nome: Rekognition = reconhece imagens; Polly = fala (texto → voz); Transcribe = transcreve (voz → texto); Translate = traduz; Comprehend = compreende textos.",
        "Lex = chatbot; SageMaker = criar seus próprios modelos; Textract = extrai texto de documentos.",
      ],
      map: [
        ["Amazon SageMaker AI", "criar, treinar e implantar modelos"],
        ["Amazon Rekognition", "análise de imagens e vídeos"],
        ["Amazon Lex", "chatbots"],
        ["Amazon Polly", "texto em fala"],
        ["Amazon Comprehend", "análise de texto"],
        ["Amazon Kendra", "busca inteligente em documentos"],
      ],
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
      task: "4.1",
      tips: [
        "Sob demanda = sem compromisso. Reservadas e Savings Plans = compromisso de 1 ou 3 anos com desconto. Spot = capacidade que sobra, bem mais barata, pode ser interrompida.",
        "Hosts dedicados = servidor físico só seu (licenças por servidor, conformidade).",
      ],
      map: [
        ["Sob demanda", "cargas curtas ou imprevisíveis"],
        ["Instâncias reservadas", "uso estável por 1 ou 3 anos"],
        ["Savings Plans", "compromisso de gasto por hora, flexível"],
        ["Instâncias spot", "tarefas que aceitam interrupção"],
        ["Hosts dedicados", "servidor físico dedicado"],
      ],
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
      task: "4.2",
      tips: [
        "Budgets AVISA (alertas de orçamento); Cost Explorer EXPLORA o que já foi gasto e as tendências; Pricing Calculator ESTIMA antes de criar.",
        "Tags de alocação de custos separam a conta por projeto; Organizations junta tudo numa fatura só.",
      ],
      map: [
        ["AWS Budgets", "alertas de orçamento"],
        ["AWS Cost Explorer", "analisar gastos e tendências"],
        ["AWS Pricing Calculator", "estimar custos"],
        ["Cost and Usage Report", "relatório detalhado de uso"],
        ["Tags de alocação de custos", "dividir custos por projeto"],
      ],
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
      task: "4.3",
      tips: [
        "Gerente técnico de conta (TAM) dedicado: plano Enterprise. Trusted Advisor dá recomendações de custo, segurança, desempenho e limites.",
        "Rede de Parceiros (APN) = consultorias e fornecedores de software; Marketplace = loja de software de terceiros; re:Post = comunidade de perguntas.",
      ],
      map: [
        ["Planos de suporte", "Basic, Developer, Business e Enterprise"],
        ["AWS Trusted Advisor", "boas práticas e economia"],
        ["AWS Health Dashboard", "eventos que afetam a sua conta"],
        ["AWS Marketplace", "software de terceiros"],
        ["AWS Professional Services", "consultoria da própria AWS"],
      ],
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

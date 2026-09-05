import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

export interface ContractPDFData {
  type?: string; // "decoracao" | "locacao"
  clientName: string;
  clientDocType?: string | null; // "cpf" (pessoa física) | "cnpj" (pessoa jurídica)
  clientCpf: string; // CPF ou CNPJ, conforme clientDocType
  clientRg: string; // RG ou Inscrição Estadual, conforme clientDocType
  clientAddress: string;
  eventType: string;
  eventStart: Date;
  eventEnd: Date;
  eventLocation: string;
  serviceDescription?: string | null;
  value: number;
  paymentSignalPct: number;
  paymentTerms?: string | null;
  paymentInstallments?: number | null;
  paymentInstallmentValue?: number | null;
  extraHourValue?: number | null;
  signCity: string;
  signDate: Date;
}

/**
 * Cria um conjunto de estilos a partir das medidas de tipografia.
 * Existe para o contrato de locação poder ter a diagramação folgada do modelo
 * assinado (letra e espaçamento de Word) sem alterar o de decoração.
 */
function criarEstilos(m: {
  fontSize: number;
  lineHeight: number;
  paddingV: number;
  paddingH: number;
  titleSize: number;
  paragraphGap: number;
  sectionGap: number;
}) {
  return StyleSheet.create({
  page: {
    paddingTop: m.paddingV,
    paddingBottom: m.paddingV,
    paddingHorizontal: m.paddingH,
    fontSize: m.fontSize,
    fontFamily: "Times-Roman",
    lineHeight: m.lineHeight,
    color: "#000",
  },
  title: {
    fontFamily: "Times-Bold",
    fontSize: m.titleSize,
    textAlign: "center",
    padding: 6,
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 14,
  },
  sectionHeader: {
    fontFamily: "Times-Bold",
    fontSize: m.fontSize,
    padding: 4,
    borderWidth: 1,
    borderColor: "#000",
    marginTop: m.sectionGap,
    marginBottom: m.sectionGap * 0.8,
  },
  paragraph: {
    textAlign: "justify",
    marginBottom: m.paragraphGap,
  },
  clauseLabel: {
    fontFamily: "Times-Bold",
  },
  intro: {
    textAlign: "justify",
    marginTop: m.paragraphGap,
    marginBottom: m.paragraphGap,
  },
  servicesBlock: {
    marginLeft: 24,
    marginTop: 2,
    marginBottom: 6,
  },
  serviceLine: {
    marginBottom: 1,
  },
  signatureBlock: {
    marginTop: 36,
  },
  signDate: {
    textAlign: "right",
    marginBottom: 28,
  },
  signLine: {
    borderTopWidth: 1,
    borderTopColor: "#000",
    width: "75%",
    marginTop: 18,
    marginBottom: 2,
  },
  signLabel: {
    fontFamily: "Times-Bold",
  },
  witnessRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  witnessCol: {
    width: "45%",
  },
  witnessLine: {
    borderTopWidth: 1,
    borderTopColor: "#000",
    marginBottom: 4,
  },
  witnessText: {
    fontSize: m.fontSize - 1,
  },
  });
}

// Decoração: diagramação compacta original (não mexer sem pedido)
const styles = criarEstilos({
  fontSize: 10.5,
  lineHeight: 1.4,
  paddingV: 50,
  paddingH: 60,
  titleSize: 11,
  paragraphGap: 6,
  sectionGap: 10,
});

// Locação: medidas ajustadas para bater com o modelo assinado (6 páginas)
const stylesLocacao = criarEstilos({
  fontSize: 12,
  lineHeight: 1.6,
  paddingV: 60,
  paddingH: 48,
  titleSize: 12,
  paragraphGap: 14,
  sectionGap: 18,
});

function fmtDate(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
function fmtCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtSignDate(d: Date) {
  const months = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
}

function isPJ(data: ContractPDFData) {
  return data.clientDocType === "cnpj";
}

/**
 * Qualificação do cliente após o nome, conforme pessoa física ou jurídica.
 * PF:  "portador(a) do RG nº ..., devidamente inscrito(a) no CPF nº ..., residente e domiciliado(a) na ..."
 * PJ:  "inscrita no CNPJ sob nº ... e I.E nº ..., com sede na ..."   (mesma redação usada para a LOCADORA)
 */
function ClientQualification({ data }: { data: ContractPDFData }) {
  if (isPJ(data)) {
    const ie = data.clientRg?.trim();
    return (
      <Text>
        pessoa jurídica de direito privado, inscrita no CNPJ sob nº {data.clientCpf}
        {ie ? ` e I.E nº ${ie}` : ""}, com sede na {data.clientAddress}.
      </Text>
    );
  }
  return (
    <Text>
      portador(a) do RG nº {data.clientRg}, devidamente inscrito(a) no CPF nº {data.clientCpf},
      residente e domiciliado(a) na {data.clientAddress}.
    </Text>
  );
}

export function ContractPDF({ data }: { data: ContractPDFData }) {
  if (data.type === "locacao") return <LocacaoContract data={data} />;
  return <DecoracaoContract data={data} />;
}

function DecoracaoContract({ data }: { data: ContractPDFData }) {
  const installmentsTxt = data.paymentInstallments && data.paymentInstallmentValue
    ? `${data.paymentInstallments} parcelas mensais, iguais e consecutivas de ${fmtCurrency(data.paymentInstallmentValue)}`
    : "____ parcelas mensais, iguais e consecutivas de R$ __________";

  // Quebra a descrição de serviços em linhas, mantendo cabeçalhos em destaque quando estão em CAIXA ALTA
  const serviceLines = (data.serviceDescription ?? "").split(/\r?\n/).map((l) => l.trim());

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>CONTRATO PRESTAÇÃO DE SERVIÇO DE DECORAÇÃO</Text>

        {/* PARTES */}
        <Text style={styles.sectionHeader}>PARTES</Text>

        <Text style={styles.paragraph}>
          <Text style={styles.clauseLabel}>CONTRATADO: LUCINÉIA APARECIDA DA SILVA INÁCIO, </Text>
          brasileira, casada, do lar, inscrita no RG sob nº 46.939.636-2/SSP/SP e CPF nº 289.853.288-87,
          residente e domiciliada na Chácara Colly Eventos (fundos), situada na Estrada dos Pereiras, em Amparo/SP.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.clauseLabel}>CONTRATANTE; {data.clientName.toUpperCase()}, </Text>
          <ClientQualification data={data} />
        </Text>

        <Text style={styles.intro}>
          Pelo presente instrumento particular, as partes contratantes têm, entre si, justo e contratado o seguinte,
          que mutuamente aceitam e acordam, a saber:
        </Text>

        {/* CONDIÇÕES DO CONTRATO */}
        <Text style={styles.sectionHeader}>CONDIÇÕES DO CONTRATO</Text>

        <Text style={styles.paragraph}>
          <Text style={styles.clauseLabel}>Cláusula 1ª. </Text>
          O presente contrato tem como objeto a prestação de serviços de decoração destinado à realização do evento
          {" "}{data.eventType}, com início às {fmtTime(data.eventStart)} horas do dia {fmtDate(data.eventStart)} e
          a terminar às {fmtTime(data.eventEnd)} horas do dia {fmtDate(data.eventEnd)}, no espaço {data.eventLocation}.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.clauseLabel}>Cláusula 2ª. </Text>
          A título de contraprestação pelos serviços ora contratados, o CONTRATANTE se obriga a pagar à CONTRATADA
          o valor de {fmtCurrency(data.value)}, a ser pago da seguinte forma:
        </Text>
        <Text style={styles.paragraph}>
          a) {data.paymentSignalPct}% do valor total, a título de sinal para reserva da data, no ato da assinatura do contrato;
        </Text>
        <Text style={styles.paragraph}>
          b) o saldo remanescente, em até {installmentsTxt} ou integralmente até 15 dias antes da realização do evento.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.clauseLabel}>Cláusula 3ª. </Text>
          Os serviços incluem:
        </Text>
        <View style={styles.servicesBlock}>
          {serviceLines.filter((l) => l.length > 0).map((line, i) => {
            const isHeader = line === line.toUpperCase() && line.length < 30 && !/\d/.test(line.charAt(0));
            return (
              <Text key={i} style={[styles.serviceLine, isHeader ? styles.clauseLabel : {}]}>
                {line}
              </Text>
            );
          })}
        </View>

        {/* OBRIGAÇÕES DA CONTRATADA */}
        <Text style={styles.sectionHeader}>DAS OBRIGAÇÕES DA CONTRATADA</Text>

        <Text style={styles.paragraph}>
          <Text style={styles.clauseLabel}>Cláusula 4ª. </Text>
          A CONTRATADA se compromete a:
        </Text>
        <Text style={styles.paragraph}>a) executar a decoração conforme o combinado com o CONTRATANTE;</Text>
        <Text style={styles.paragraph}>b) empregar materiais em bom estado e mão de obra qualificada;</Text>
        <Text style={styles.paragraph}>c) cumprir os prazos de montagem e desmontagem ajustados;</Text>
        <Text style={styles.paragraph}>d) zelar pelo espaço do evento, respondendo por eventuais danos causados por sua equipe;</Text>
        <Text style={styles.paragraph}>e) substituir, quando necessário, itens danificados ou com defeito, por equivalentes em qualidade e estética, mediante ciência e aprovação do CONTRATANTE;</Text>
        <Text style={styles.paragraph}>f) retirar todos os materiais próprios e resíduos ao final do evento;</Text>
        <Text style={styles.paragraph}>g) arcar com todos os impostos, encargos e despesas de sua responsabilidade;</Text>
        <Text style={styles.paragraph}>h) manter sigilo sobre informações do CONTRATANTE.</Text>

        {/* OBRIGAÇÕES DA CONTRATANTE */}
        <Text style={styles.sectionHeader}>DAS OBRIGAÇÕES DA CONTRATANTE</Text>

        <Text style={styles.paragraph}>
          <Text style={styles.clauseLabel}>Cláusula 5ª. </Text>
          Compete ao CONTRATANTE:
        </Text>
        <Text style={styles.paragraph}>a) permitir o acesso da CONTRATADA ao local do evento nos horários combinados;</Text>
        <Text style={styles.paragraph}>b) efetuar os pagamentos na forma e prazos estipulados neste contrato;</Text>
        <Text style={styles.paragraph}>d) responder por danos causados por convidados/terceiros aos itens de propriedade da CONTRATADA;</Text>

        {/* ALTERAÇÃO DA DATA */}
        <Text style={styles.sectionHeader}>DA ALTERAÇÃO DA DATA</Text>

        <Text style={styles.paragraph}>
          <Text style={styles.clauseLabel}>Cláusula 6ª. </Text>
          Caso haja a necessidade de alteração da data do evento, a transferência será permitida, desde que haja outra
          disponível e que os valores sejam atualizados. Esta possível transferência só será permitida se informada
          até 6 meses antes da realização do evento.
        </Text>

        {/* RESCISÃO */}
        <Text style={styles.sectionHeader}>DA RESCISÃO DO CONTRATO</Text>

        <Text style={styles.paragraph}>
          <Text style={styles.clauseLabel}>Cláusula 7ª. </Text>
          No caso de a rescisão contratual ocorrer por parte da CONTRATANTE, este incorrerá nas seguintes multas:
        </Text>
        <Text style={styles.paragraph}>a) retenção de 20% sobre o valor já pago, se houver comunicado por escrito ao CONTRATADO, com antecedência superior a 240 dias da data do evento;</Text>
        <Text style={styles.paragraph}>b) retenção de 30% sobre o valor já pago, se houver comunicado por escrito ao CONTRATADO, com antecedência inferior a 180 dias da data do evento.</Text>
        <Text style={styles.paragraph}>c) retenção de 50% sobre o valor já pago, se houver comunicado por escrito ao CONTRATADO, com antecedência inferior a 60 dias da data do evento.</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.clauseLabel}>Parágrafo único. </Text>
          Caso a parte CONTRATANTE ainda não tenha adimplido o valor correspondente ao percentual da multa incidente,
          esta deverá ser quitada no ato a comunicação da rescisão ou em data aprazada no momento da assinatura do termo de rescisão.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.clauseLabel}>Cláusula 8ª. </Text>
          No caso da rescisão contratual ocorrer por parte da CONTRATADA, esta deverá restituir integralmente os valores recebidos.
        </Text>

        {/* PENALIDADES */}
        <Text style={styles.sectionHeader}>PENALIDADES</Text>

        <Text style={styles.paragraph}>
          <Text style={styles.clauseLabel}>Cláusula 9ª. </Text>
          O não pagamento do valor acordo dentro dos prazos fixados, importará na incidência de juros de mora de 1% ao mês,
          atualização monetária e multa moratória de 20% (vinte por cento), sendo que tais acréscimos serão pagos juntamente
          com o principal, sem prejuízo do vencimento antecipado do debito no caso de vencimento de duas parcelas consecutivas
          ou não, ou apenas da última – cláusula 2ª, sob pena de rescisão contratual e execução do saldo devedor. Em caso de
          intervenção de advogado, judicial ou extrajudicialmente, mais honorários advocatícios de 20% sobre o valor do débito.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.clauseLabel}>Cláusula 10ª. </Text>
          A parte que infringir qualquer das cláusulas deste contrato, ficará obrigada ao pagamento de multa correspondente
          a 50% do valor do contrato, podendo a parte contrária considerar simultaneamente rescindido o contrato,
          independentemente de qualquer formalidade.
        </Text>

        {/* FORO */}
        <Text style={styles.sectionHeader}>FORO</Text>

        <Text style={styles.paragraph}>
          <Text style={styles.clauseLabel}>Cláusula 11ª. </Text>
          As partes elegem o foro desta Comarca de Amparo/SP, com renúncia de qualquer outro, para procedimento judicial
          decorrente deste contrato, sendo os casos nele omissos dirimidos de conformidade com a legislação vigente.
          A citação, a intimação e a notificação poderão ser efetuadas pelo correio, e, em caso de pessoa jurídica,
          também por fac-símile.
        </Text>

        {/* OUTRAS CLÁUSULAS */}
        <Text style={styles.sectionHeader}>OUTRAS CLÁUSULAS</Text>

        <Text style={styles.paragraph}>
          <Text style={styles.clauseLabel}>Cláusula 12ª. </Text>
          A CONTRATADA não se responsabiliza por catástrofes naturais e falta de energia elétrica ou demais situações
          de força maior que impossibilitem a realização do evento, ficando desobrigada de restituição de valores.
          Na ocorrência de qualquer fato que impossibilite a prestação do serviço, a CONTRATADA se prontificará a
          disponibilizar outra data para realização do evento, sem custos adicionais para ambas as partes.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.clauseLabel}>Parágrafo único. </Text>
          Salienta-se que o espaço Colly Eventos possui um gerador para ser utilizado em caso de falta de energia,
          com duração de aproximadamente 04 horas, conectado às lâmpadas do salão principal e com uma conexão para aparelho de som.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.clauseLabel}>Cláusula 13ª. </Text>
          O CONTRATANTE autoriza a CONTRATADA a proceder ajustes na decoração contratada, sempre que, por motivo de
          força maior ou indisponibilidade de materiais, não seja possível manter integralmente o modelo originalmente
          acordado, desde que preservadas as cores e o tema previamente definidos.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.clauseLabel}>Cláusula 14ª. </Text>
          Ademais, O CONTRATADO não se responsabiliza pela mobília existente no local do evento. Caso seja necessária
          a remoção de algum item do mobiliário para a execução do serviço, este será recolocado no mesmo local e estado
          em que se encontrava. Alterações significativas no layout do espaço, tais como movimentação de móveis de grande
          porte ou modificações estruturais, deverão ser previamente autorizadas pelo responsável pelo local e executadas
          por equipe especializada contratada pelo CONTRATANTE, às suas expensas.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.clauseLabel}>Cláusula 15ª. </Text>
          Qualquer alteração, modificação ou ajuste das condições contratadas somente terá validade se formalizada
          mediante termo aditivo escrito, devidamente assinado por ambas as partes.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.clauseLabel}>Cláusula 16ª. </Text>
          O CONTRATANTE autoriza a captação de imagens do ambiente decorado para portfólio da CONTRATADA, sem identificação
          de convidados, respeitados os direitos de imagem.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.clauseLabel}>Cláusula 17ª. </Text>
          O CONTRATANTE, em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei n. 13.709/2018),
          declara seu expresso consentimento para que o CONTRATADO colete, trate, armazene e compartilhe os dados
          pessoais fornecidos no âmbito deste contrato, exclusivamente para os fins relacionados à execução do presente contrato.
        </Text>

        <Text style={styles.intro}>
          Assim, por estarem justos e contratados, assinam o presente contrato em 02 (duas) vias de igual teor,
          na presença das testemunhas abaixo, destinando-se uma via para cada uma das partes interessadas.
        </Text>

        {/* Assinaturas */}
        <View style={styles.signatureBlock}>
          <Text style={styles.signDate}>{data.signCity}, {fmtSignDate(data.signDate)}</Text>
          <View style={styles.signLine} />
          <Text style={styles.signLabel}>Contratada: LUCINÉIA APARECIDA DA SILVA INÁCIO</Text>
          <View style={[styles.signLine, { marginTop: 30 }]} />
          <Text style={styles.signLabel}>Contratante: {data.clientName.toUpperCase()}</Text>
        </View>
      </Page>
    </Document>
  );
}

/* ─────────────────────────────────────────────────────────────
   CONTRATO DE LOCAÇÃO TEMPORÁRIA DE AMBIENTE PARA FESTAS E EVENTOS
   ───────────────────────────────────────────────────────────── */
function LocacaoContract({ data }: { data: ContractPDFData }) {
  const s = stylesLocacao;
  const signalValue = data.value * (data.paymentSignalPct / 100);
  const extraTxt = data.extraHourValue
    ? fmtCurrency(data.extraHourValue)
    : "R$ __________";

  // Cláusula 3ª: forma de pagamento em texto livre; se vazia, monta a partir do sinal.
  const rawPayment = data.paymentTerms?.trim()
    || `entrada de ${data.paymentSignalPct}% (${fmtCurrency(signalValue)}) e o restante parcelado`;
  const paymentTxt = /[.;!?]$/.test(rawPayment) ? rawPayment : `${rawPayment}.`;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>CONTRATO DE LOCAÇÃO TEMPORÁRIA DE AMBIENTE PARA FESTAS E EVENTOS</Text>

        {/* PARTES */}
        <Text style={s.sectionHeader}>PARTES</Text>

        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>LOCADORA: LUCINÉIA APARECIDA DA SILVA INÁCIO MEI, </Text>
          inscrita no CNPJ sob nº 26.209.953/0001-58 e I. E nº 168091340118, Chácara Colly Eventos,
          situada na Estrada dos Pereiras, em Amparo/SP.
        </Text>

        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>
            {isPJ(data) ? "LOCATÁRIA: " : "LOCATÁRIO(A): "}{data.clientName.toUpperCase()},{" "}
          </Text>
          <ClientQualification data={data} />
        </Text>

        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>IMÓVEL: </Text>
          Chácara Colly Eventos, situada na Estrada dos Pereiras, em Amparo/SP.
        </Text>

        <Text style={s.intro}>
          Pelo presente instrumento particular, as partes contratantes têm, entre si, justo e contratado o seguinte,
          que mutuamente aceitam e acordam, a saber:
        </Text>

        {/* CONDIÇÕES DA LOCAÇÃO */}
        <Text style={s.sectionHeader}>CONDIÇÕES DA LOCAÇÃO</Text>

        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Cláusula 1ª. </Text>
          A locação se iniciará às {fmtTime(data.eventStart)} horas do dia {fmtDate(data.eventStart)} e a terminar
          às {fmtTime(data.eventEnd)} horas do dia {fmtDate(data.eventEnd)}, data em que o LOCATÁRIO obriga-se a
          restituir o imóvel desocupado, independentemente de qualquer aviso ou notificação, com trinta minutos de
          tolerância, sem nenhum custo adicional;
        </Text>

        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Cláusula 2ª. </Text>
          O imóvel objeto da presente locação destina-se exclusivamente para a realização de evento {data.eventType},
          não podendo sua destinação ser mudada sem o consentimento expresso da LOCADORA;
        </Text>

        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Cláusula 3ª. </Text>
          O valor do aluguel é de {fmtCurrency(data.value)} que o LOCATÁRIO se compromete a pagar da seguinte forma:
          {" "}{paymentTxt}
        </Text>

        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Cláusula 4ª. </Text>
          Quando por opção do LOCATÁRIO, houver a intenção da contratação de horas extras, este deverá comunicar à
          LOCADORA e providenciar o pagamento do valor contratado meia hora antes do horário firmado na locação inicial.
          O valor correspondente a cada hora extra é de {extraTxt}.
        </Text>

        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Cláusula 5ª. </Text>
          Caso haja necessidade de alteração da data do evento, a transferência será permitida desde que haja outra
          data disponível e que os valores sejam atualizados. Esta possível transferência só será permitida se informada
          até 6 meses antes da realização do evento. Após este prazo, será cobrada uma taxa de transferência referente
          a 60% do valor do novo contrato, e o contrato anterior deverá ser quitado.
        </Text>

        <Text style={s.sectionHeader}>DA RESCISÃO DO CONTRATO</Text>

        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Cláusula 6ª. </Text>
          No caso da rescisão contratual ocorrer por parte do LOCATÁRIO em até 12 meses antes do evento, o valor das
          parcelas pagas deverá ser restituído. No caso da rescisão ocorrer no prazo inferior a 12 meses da data
          contratada, não haverá restituição dos valores já pagos pelo LOCATÁRIO até o momento da rescisão. As parcelas
          vencidas e não quitadas deverão ser pagas na ocasião.
        </Text>

        <Text style={s.sectionHeader}>CONSERVAÇÃO DO IMÓVEL</Text>

        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Cláusula 7ª. </Text>
          Incumbe ao LOCATÁRIO a conservação geral do imóvel, de forma a devolvê-lo, finda a locação, no perfeito estado
          em que ora o recebe, devendo o mesmo estar desocupado de pessoas e objetos.
        </Text>
        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Parágrafo primeiro. </Text>
          O LOCATÁRIO declara ter vistoriado o imóvel antes da locação, verificando pessoalmente encontrar-se o mesmo
          de acordo com o Termo de vistoria e fotos em anexo, momento em que serão esclarecidas todas as dúvidas quanto
          ao uso, capacidade e disponibilidades. Obriga-se a restituir o imóvel finda a locação, no estado
          em que recebeu, salvo as deteriorações decorrentes do seu uso normal. Após o término da locação, LOCATÁRIO e
          LOCADOR, ou quem este último indicar, vistoriarão o imóvel, suas dependências e utensílios, para apuração de
          danos ocorridos. Caso haja recusa do Locatário em assinar a vistoria final, o Locador providenciará a assinatura
          de 02 (duas) testemunhas que tenham conhecimento do estado do imóvel. Se os reparos não forem realizados dentro
          de 48 (quarenta e oito) horas a contar da nova vistoria, os mesmos serão realizados pelo Locador às expensas do
          Locatário, ficando o LOCATÁRIO ainda responsável pelo pagamento dos aluguéis e demais encargos da locação, caso
          os danos existentes inviabilizem as próximas locações.
        </Text>

        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Cláusula 8ª. </Text>
          Ocorrendo qualquer dano no imóvel, o LOCATÁRIO deverá indenizar os reparos de imediato, assim que lhe
          apresentada nota de custo para devidos reparos e, se o caso, do aluguel dos dias em que o imóvel não puder
          ser novamente utilizado.
        </Text>
        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Parágrafo primeiro. </Text>
          Antes de conectar qualquer aparelho elétrico ou eletrônico nas tomadas do imóvel, o LOCATÁRIO deverá verificar
          a sua voltagem, evitando-se qualquer dano daí decorrente.
        </Text>
        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Parágrafo segundo. </Text>
          Não é permitido comer e beber na piscina, bem como a utilização de bronzeadores e qualquer objeto cortante ou perfurante.
        </Text>

        <Text style={s.sectionHeader}>TRANSFERÊNCIA E SUBLOCAÇÃO</Text>

        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Cláusula 9ª. </Text>
          Não é permitida a transferência deste contrato, nem a sublocação, cessão ou empréstimo total ou parcial do
          imóvel, sem prévio consentimento por escrito da LOCADORA, devendo no caso deste ser dado, agir oportunamente
          junto aos ocupantes, a fim de que o imóvel esteja desimpedido no termo do presente contrato.
        </Text>

        <Text style={s.sectionHeader}>PENALIDADES</Text>

        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Cláusula 10ª. </Text>
          O não pagamento do valor acordado dentro dos prazos fixados importará na incidência de juros de mora de 1% ao
          mês ou fração, atualização monetária e multa moratória de 20% (vinte por cento), sendo que tais acréscimos serão
          pagos juntamente com o principal, sem prejuízo do vencimento antecipado do débito no caso de vencimento de duas
          parcelas consecutivas ou não, ou apenas da última – cláusula 6ª, §1º, sob pena de rescisão contratual e execução
          do saldo devedor. Em caso de intervenção de advogado, judicial ou extrajudicialmente, mais honorários advocatícios
          de 20% sobre o valor do débito.
        </Text>
        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Cláusula 11ª. </Text>
          A parte que infringir qualquer das cláusulas deste contrato, ficará obrigada ao pagamento de multa correspondente
          a 03 (três) aluguéis, nos valores em que estiverem vigorando, podendo a parte contrária considerar simultaneamente
          rescindida a locação, independentemente de qualquer formalidade.
        </Text>

        <Text style={s.sectionHeader}>FORO</Text>

        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Cláusula 12ª. </Text>
          As partes elegem o foro desta Comarca de Amparo/SP, com renúncia de qualquer outro, para procedimento judicial
          decorrente deste contrato, sendo os casos nele omissos dirimidos de conformidade com a legislação vigente.
          A citação, a intimação e a notificação poderão ser efetuadas pelo correio, e, em caso de pessoa jurídica,
          também por fac-símile.
        </Text>

        <Text style={s.sectionHeader}>OUTRAS CLÁUSULAS</Text>

        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Cláusula 13ª. </Text>
          O LOCATÁRIO não poderá furar as paredes do imóvel, sem o consentimento expresso da LOCADORA.
        </Text>
        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Cláusula 14ª. </Text>
          O LOCATÁRIO declara conhecer a legislação municipal utilizando o imóvel de acordo com as exigências da Lei,
          em especial quanto à intensidade do som (lei do silêncio – das 22h às 7h); permanência de menores; uso de
          bebidas; cumprindo ainda a política da boa vizinhança, não incomodando terceiros, na proximidade da locação.
        </Text>
        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Parágrafo segundo. </Text>
          Os horários e programações serão definidos pelos organizadores, havendo apenas a ressalva quanto ao horário e
          volume do som, respeitando a "LEI DO SILÊNCIO" das 22h às 07h da manhã.
        </Text>
        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Cláusula 15ª. </Text>
          O LOCATÁRIO e seus responsáveis deverão estar atentos aos menores para evitar qualquer tipo de acidente, não
          havendo qualquer responsabilidade por parte da LOCADORA.
        </Text>
        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Cláusula 16ª. </Text>
          São de responsabilidade do LOCATÁRIO toda montagem da festa, como mesas, cadeiras, enfeites, produtos de
          higiene e limpeza, som, iluminação (que não seja a já existente no local), roupas de cama, cobertores entre outros.
        </Text>
        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Parágrafo 1º. </Text>
          O LOCADOR não fornecerá: a) serviços e fornecimento de alimentação, som, iluminação e decoração. O LOCATÁRIO
          deverá contratar os serviços que necessitar, ficando responsável por qualquer dano causado por seus contratados.
        </Text>
        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Parágrafo 2º. </Text>
          O LOCADOR fornecerá: a) materiais de limpeza como sabão, desinfetante e pano de chão ou de prato, papel
          higiênico, sanito e sabonete para as mãos; b) 20 mesas, 200 cadeiras, toalhas e uma pessoa responsável pela
          limpeza dos banheiros durante o evento.
        </Text>
        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Parágrafo 3º. </Text>
          A LOCADORA também não se responsabiliza por qualquer objeto esquecido ou perdido durante o evento; se
          encontrado será guardado e entregue ao reclamante ou ao LOCATÁRIO.
        </Text>
        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Cláusula 17ª. </Text>
          O uso de chuveiro, torneiras, descarga e energia elétrica deve ser racional, evitando desperdício.
        </Text>
        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Cláusula 18ª. </Text>
          É de responsabilidade do LOCATÁRIO a organização básica das dependências, colocando todo o lixo em sacos
          fechados nos locais para isso destinados, retirando sobras de alimento e de decoração, recolocando móveis e
          objetos em seus locais originais, desligando luzes, verificando fechamento de torneiras, janelas e portas.
        </Text>
        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Cláusula 19ª. </Text>
          O respeito deve ser observado de acordo com os princípios da consciência ecológica, colocando lixo e bitucas
          de cigarro em locais apropriados e não agredindo árvores, plantas, frutas e flores, como também pequenos
          animais próprios do local — passarinhos, saguis, esquilos e outros.
        </Text>
        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Cláusula 20ª. </Text>
          A LOCADORA não se responsabiliza por catástrofes naturais e falta de energia elétrica ocorrida antes e durante
          o período de locação. Na ocorrência de qualquer fato que impossibilite a utilização da chácara, a LOCADORA se
          prontificará a disponibilizar outra data para realização do evento, sem custos adicionais para ambas as partes.
        </Text>
        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Parágrafo 1º. </Text>
          Salienta-se que a chácara possui um gerador para ser utilizado em caso de falta de energia, com duração de
          aproximadamente 04 horas, conectado às lâmpadas do salão principal e com uma conexão para aparelho de som.
          Observação: o gerador não alimenta painel de led, pista paris e fritadeira.
        </Text>
        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Cláusula 21ª. </Text>
          No caso de desapropriação do imóvel locado, ficará a LOCADORA desobrigada por todas as cláusulas deste contrato,
          ressalvada aos LOCATÁRIOS tão somente a faculdade de haver do poder desapropriante a indenização a que,
          porventura, tiver direito;
        </Text>
        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Cláusula 22ª. </Text>
          A vistoria na entrega das chaves e a limpeza de todas as dependências utilizadas são de responsabilidade da LOCADORA.
        </Text>
        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Cláusula 23ª. </Text>
          Nenhuma intimação do serviço sanitário será motivo para o LOCATÁRIO abandonar o imóvel ou pedir rescisão deste
          contrato, salvo procedendo vistoria judicial, que apure estar a construção ameaçando ruir.
        </Text>
        <Text style={s.paragraph}>
          <Text style={s.clauseLabel}>Cláusula 24ª. </Text>
          Será exigido bom comportamento e, havendo reclamação da vizinhança sobre qualquer conduta que venha a ferir
          qualquer artigo presente na Constituição Brasileira, Código Civil ou Código Penal Brasileiro, será apurado e o
          LOCATÁRIO responderá em juízo pelos atos cometidos durante o evento, tornando a LOCADORA isenta de qualquer
          responsabilidade. O LOCATÁRIO deve providenciar pessoas que garantam segurança para os convidados, evitando
          entrada de pessoas estranhas, brigas, tumultos etc. A LOCADORA poderá advertir o LOCATÁRIO e, não sendo
          obedecido, poderá acionar a autoridade competente.
        </Text>

        <Text style={s.intro}>
          Assim, por estarem justos e contratados, assinam o presente contrato em 02 (duas) vias de igual teor, na
          presença das testemunhas abaixo, destinando-se uma via para cada uma das partes interessadas, bem como o
          Termo de Vistoria e fotos do estado e pertences atuais do imóvel.
        </Text>

        {/* Assinaturas */}
        <View style={s.signatureBlock}>
          <Text style={s.signDate}>{data.signCity}, {fmtSignDate(data.signDate)}</Text>
          <View style={s.signLine} />
          <Text style={s.signLabel}>Locadora: LUCINÉIA APARECIDA DA SILVA INÁCIO</Text>
          <View style={[s.signLine, { marginTop: 28 }]} />
          <Text style={s.signLabel}>
            {isPJ(data) ? "Locatária: " : "Locatário(a): "}{data.clientName.toUpperCase()}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

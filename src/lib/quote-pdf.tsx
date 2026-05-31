import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

interface QuoteItemData {
  productName: string;
  productUnit: string;
  quantity: number;
  unitPrice: number;
  listPrice?: number;
  total: number;
  notes?: string | null;
}

interface QuotePDFData {
  number: number;
  createdAt: Date;
  clientName: string;
  clientDoc?: string | null;
  clientAddress?: string | null;
  clientPhone?: string | null;
  clientEmail?: string | null;
  items: QuoteItemData[];
  notes?: string | null;
  paymentTerms?: string | null;
  validity?: string | null;
  logoSrc: string;
  subtotal: number;
  discount: number;
  total: number;
}

const COLORS = {
  primary: "#2a2419",
  secondary: "#6b5d47",
  muted: "#9b8b73",
  accent: "#d4a017",
  border: "#d4cdbe",
  borderLight: "#e5e0d4",
  bgSoft: "#faf8f3",
  bgHeader: "#f5f1ea",
};

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: COLORS.primary,
    backgroundColor: "#ffffff",
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  logoBox: {
    marginRight: 14,
  },
  companyInfo: {
    flex: 1,
    paddingTop: 4,
  },
  companyName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  companyDetail: {
    fontSize: 9,
    color: COLORS.secondary,
    lineHeight: 1.4,
  },
  amberLine: {
    height: 2,
    backgroundColor: COLORS.accent,
    marginVertical: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginVertical: 8,
  },

  // Number/Date row
  numberRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  numberLabel: {
    width: 100,
    backgroundColor: COLORS.bgHeader,
    padding: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    borderRightWidth: 1,
    borderColor: COLORS.border,
  },
  numberValue: {
    flex: 1,
    padding: 6,
    fontSize: 9,
  },
  dateLabel: {
    width: 60,
    backgroundColor: COLORS.bgHeader,
    padding: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border,
  },

  // Para section
  paraLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginBottom: 4,
  },
  clientTable: {
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  clientRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    minHeight: 22,
  },
  clientRowLast: {
    flexDirection: "row",
    minHeight: 22,
  },
  clientLabelCell: {
    width: 130,
    backgroundColor: COLORS.bgHeader,
    padding: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    borderRightWidth: 1,
    borderColor: COLORS.border,
  },
  clientValueCell: {
    flex: 1,
    padding: 6,
    fontSize: 9,
  },
  clientHalf: {
    flex: 1,
    flexDirection: "row",
  },

  // Items table
  itemsLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginBottom: 4,
  },
  itemsTable: {
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  itemsHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.bgHeader,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  itemsRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: COLORS.borderLight,
    minHeight: 22,
  },
  itemsRowEmpty: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: COLORS.borderLight,
    minHeight: 14,
  },
  th: {
    padding: 5,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: COLORS.border,
  },
  thLast: {
    padding: 5,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textAlign: "center",
  },
  td: {
    padding: 5,
    fontSize: 8,
    textAlign: "center",
    borderRightWidth: 0.5,
    borderColor: COLORS.borderLight,
  },
  tdLast: {
    padding: 5,
    fontSize: 8,
    textAlign: "center",
  },
  // column widths (sum should fit)
  colItem: { width: 28 },
  colDesc: { flex: 1, textAlign: "left" },
  colUn: { width: 36 },
  colQty: { width: 40 },
  colPrice: { width: 60 },
  colDesc2: { width: 40 },
  colUnit: { width: 60 },
  colTotal: { width: 65 },

  // Totals
  totalsWrap: {
    alignItems: "flex-end",
    marginBottom: 14,
  },
  totalsBox: {
    width: 240,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  totalsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  totalsLabel: {
    flex: 1,
    backgroundColor: COLORS.bgHeader,
    padding: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    borderRightWidth: 1,
    borderColor: COLORS.border,
  },
  totalsValue: {
    width: 120,
    padding: 6,
    fontSize: 10,
    textAlign: "right",
  },
  totalGeralRow: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
  },
  totalGeralLabel: {
    flex: 1,
    padding: 7,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    borderRightWidth: 1,
    borderColor: COLORS.primary,
  },
  totalGeralValue: {
    width: 120,
    padding: 7,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    textAlign: "right",
  },

  // Observações
  obsTable: {
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    flexDirection: "row",
    minHeight: 60,
  },
  obsLabel: {
    width: 130,
    backgroundColor: COLORS.bgHeader,
    padding: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    borderRightWidth: 1,
    borderColor: COLORS.border,
  },
  obsValue: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    lineHeight: 1.5,
  },

  // Payment & Validity
  paymentRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  paymentBox: {
    flex: 1,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  validityBox: {
    flex: 1,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paymentLabel: {
    width: 130,
    backgroundColor: COLORS.bgHeader,
    padding: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    borderRightWidth: 1,
    borderColor: COLORS.border,
  },
  paymentValue: {
    flex: 1,
    padding: 6,
    fontSize: 9,
  },

  // Signatures
  signatures: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 14,
    marginBottom: 14,
  },
  signatureBlock: {
    width: 200,
    alignItems: "center",
  },
  signatureLine: {
    borderTopWidth: 0.5,
    borderColor: COLORS.secondary,
    width: "100%",
    paddingTop: 4,
  },
  signatureText: {
    fontSize: 9,
    color: COLORS.secondary,
    textAlign: "center",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 32,
    right: 32,
    borderTopWidth: 1,
    borderColor: COLORS.accent,
    paddingTop: 6,
    textAlign: "center",
    fontSize: 8,
    color: COLORS.muted,
  },
});

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (d: Date) => {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day} / ${month} / ${year}`;
};

const unitMap: Record<string, string> = {
  un: "un",
  kg: "kg",
  hora: "h",
  pessoa: "pax",
  porcao: "porç",
  litro: "L",
};

export function QuotePDF({ data }: { data: QuotePDFData }) {
  const MIN_ROWS = 5;
  const emptyCount = Math.max(0, MIN_ROWS - data.items.length);
  const rows = [...data.items, ...Array(emptyCount).fill(null)];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Image src={data.logoSrc} style={{ width: 72, height: 72, objectFit: "contain" }} />
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>Colly Eventos</Text>
            <Text style={styles.companyDetail}>CNPJ: 26.209.953/0001-58</Text>
            <Text style={styles.companyDetail}>
              R. Odilon Monteiro, Estr. Mun. do Bairro dos Pereiras,
            </Text>
            <Text style={styles.companyDetail}>
              s/n - Bairro das Pereiras, Amparo - SP, 13904-060
            </Text>
            <Text style={styles.companyDetail}>Telefone: (19) 99672-9770</Text>
          </View>
        </View>

        <View style={styles.amberLine} />
        <Text style={styles.title}>Proposta Comercial</Text>

        {/* Number / Date */}
        <View style={styles.numberRow}>
          <Text style={styles.numberLabel}>Número da Proposta</Text>
          <Text style={styles.numberValue}>Nº {String(data.number).padStart(4, "0")}</Text>
          <Text style={styles.dateLabel}>Data</Text>
          <Text style={styles.numberValue}>{fmtDate(data.createdAt)}</Text>
        </View>

        {/* Para */}
        <Text style={styles.paraLabel}>Para:</Text>
        <View style={styles.clientTable}>
          <View style={styles.clientRow}>
            <Text style={styles.clientLabelCell}>Nome / Razão Social:</Text>
            <Text style={styles.clientValueCell}>{data.clientName}</Text>
          </View>
          <View style={styles.clientRow}>
            <Text style={styles.clientLabelCell}>CNPJ / CPF:</Text>
            <Text style={styles.clientValueCell}>{data.clientDoc ?? ""}</Text>
          </View>
          <View style={styles.clientRow}>
            <Text style={styles.clientLabelCell}>Endereço:</Text>
            <Text style={styles.clientValueCell}>{data.clientAddress ?? ""}</Text>
          </View>
          <View style={styles.clientRowLast}>
            <Text style={styles.clientLabelCell}>Telefone:</Text>
            <Text style={[styles.clientValueCell, { borderRightWidth: 1, borderColor: COLORS.border }]}>
              {data.clientPhone ?? ""}
            </Text>
            <Text style={[styles.clientLabelCell, { width: 60 }]}>E-mail:</Text>
            <Text style={styles.clientValueCell}>{data.clientEmail ?? ""}</Text>
          </View>
        </View>

        {/* Items */}
        <Text style={styles.itemsLabel}>Itens da Proposta Comercial</Text>
        <View style={styles.itemsTable}>
          <View style={styles.itemsHeader}>
            <Text style={[styles.th, styles.colItem]}>Item</Text>
            <Text style={[styles.th, styles.colDesc]}>Descrição do Produto / Serviço</Text>
            <Text style={[styles.th, styles.colUn]}>Un.</Text>
            <Text style={[styles.th, styles.colQty]}>Qtd.</Text>
            <Text style={[styles.th, styles.colPrice]}>Preço Lista</Text>
            <Text style={[styles.th, styles.colDesc2]}>Desc. %</Text>
            <Text style={[styles.th, styles.colUnit]}>Preço Unit.</Text>
            <Text style={[styles.thLast, styles.colTotal]}>Preço Total</Text>
          </View>
          {rows.map((item, idx) => {
            if (!item) {
              return (
                <View key={`empty-${idx}`} style={styles.itemsRowEmpty}>
                  <Text style={[styles.td, styles.colItem]}>{idx + 1}</Text>
                  <Text style={[styles.td, styles.colDesc]}> </Text>
                  <Text style={[styles.td, styles.colUn]}> </Text>
                  <Text style={[styles.td, styles.colQty]}> </Text>
                  <Text style={[styles.td, styles.colPrice]}> </Text>
                  <Text style={[styles.td, styles.colDesc2]}> </Text>
                  <Text style={[styles.td, styles.colUnit]}> </Text>
                  <Text style={[styles.tdLast, styles.colTotal]}> </Text>
                </View>
              );
            }
            const listPrice = item.listPrice ?? item.unitPrice;
            const discPct = listPrice > 0 ? ((listPrice - item.unitPrice) / listPrice) * 100 : 0;
            return (
              <View key={idx} style={styles.itemsRow}>
                <Text style={[styles.td, styles.colItem]}>{idx + 1}</Text>
                <Text style={[styles.td, styles.colDesc]}>
                  {item.productName}
                  {item.notes ? ` (${item.notes})` : ""}
                </Text>
                <Text style={[styles.td, styles.colUn]}>{unitMap[item.productUnit] ?? item.productUnit}</Text>
                <Text style={[styles.td, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.td, styles.colPrice]}>{fmt(listPrice)}</Text>
                <Text style={[styles.td, styles.colDesc2]}>{discPct > 0 ? discPct.toFixed(1) + "%" : "-"}</Text>
                <Text style={[styles.td, styles.colUnit]}>{fmt(item.unitPrice)}</Text>
                <Text style={[styles.tdLast, styles.colTotal]}>{fmt(item.total)}</Text>
              </View>
            );
          })}
        </View>

        {/* Totals */}
        <View style={styles.totalsWrap}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal:</Text>
              <Text style={styles.totalsValue}>{fmt(data.subtotal)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Desconto:</Text>
              <Text style={styles.totalsValue}>{fmt(data.discount)}</Text>
            </View>
            <View style={styles.totalGeralRow}>
              <Text style={styles.totalGeralLabel}>Total Geral:</Text>
              <Text style={styles.totalGeralValue}>{fmt(data.total)}</Text>
            </View>
          </View>
        </View>

        {/* Observações */}
        <View style={styles.obsTable}>
          <Text style={styles.obsLabel}>Observações:</Text>
          <Text style={styles.obsValue}>{data.notes ?? ""}</Text>
        </View>

        {/* Payment & Validity */}
        <View style={styles.paymentRow}>
          <View style={styles.paymentBox}>
            <Text style={styles.paymentLabel}>Forma de Pagamento:</Text>
            <Text style={styles.paymentValue}>{data.paymentTerms ?? ""}</Text>
          </View>
          <View style={styles.validityBox}>
            <Text style={styles.paymentLabel}>Validade da Proposta:</Text>
            <Text style={styles.paymentValue}>{data.validity ?? "30 dias"}</Text>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatures}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>Colly Eventos</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>Assinatura do Cliente</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Colly Eventos | (19) 99672-9770 | Amparo - SP
        </Text>
      </Page>
    </Document>
  );
}

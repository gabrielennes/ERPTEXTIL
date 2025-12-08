-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpjCpf" TEXT,
    "cep" TEXT,
    "dataCadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fornecedores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "cep" TEXT,
    "dataCadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas_a_pagar" (
    "id" TEXT NOT NULL,
    "fornecedorId" TEXT NOT NULL,
    "cnpj" TEXT,
    "valor" DOUBLE PRECISION NOT NULL,
    "parcelas" INTEGER NOT NULL DEFAULT 1,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "dataPagamento" TIMESTAMP(3) NOT NULL,
    "tipoTransacao" TEXT NOT NULL,
    "chavePix" TEXT,
    "contaBancaria" TEXT,
    "codigoBarras" TEXT,
    "pdfUrl" TEXT,
    "pdfNome" TEXT,
    "baixada" BOOLEAN NOT NULL DEFAULT false,
    "dataBaixa" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contas_a_pagar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas_a_receber" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "cnpjCpf" TEXT,
    "valor" DOUBLE PRECISION NOT NULL,
    "parcelas" INTEGER NOT NULL DEFAULT 1,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "dataRecebimento" TIMESTAMP(3) NOT NULL,
    "tipoTransacao" TEXT NOT NULL,
    "chavePix" TEXT,
    "contaBancaria" TEXT,
    "codigoBarras" TEXT,
    "pdfUrl" TEXT,
    "pdfNome" TEXT,
    "baixada" BOOLEAN NOT NULL DEFAULT false,
    "dataBaixa" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contas_a_receber_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "contas_a_pagar" ADD CONSTRAINT "contas_a_pagar_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_a_receber" ADD CONSTRAINT "contas_a_receber_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

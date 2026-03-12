-- CreateTable
CREATE TABLE "Partenaire" (
    "content_id" TEXT NOT NULL,
    "nom" TEXT,
    "url" TEXT,
    "image_url" TEXT,
    "echelle" TEXT,
    "code_epci" TEXT,
    "code_commune" TEXT,
    "code_departement" TEXT,
    "code_region" TEXT,
    "liste_communes_calculees" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Partenaire_pkey" PRIMARY KEY ("content_id")
);

-- CreateTable
CREATE TABLE "AideExpirationWarning" (
    "aide_cms_id" TEXT NOT NULL,
    "last_month" BOOLEAN NOT NULL DEFAULT false,
    "last_month_sent" BOOLEAN NOT NULL DEFAULT false,
    "last_week" BOOLEAN NOT NULL DEFAULT false,
    "last_week_sent" BOOLEAN NOT NULL DEFAULT false,
    "expired" BOOLEAN NOT NULL DEFAULT false,
    "expired_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AideExpirationWarning_pkey" PRIMARY KEY ("aide_cms_id")
);

-- CreateTable
CREATE TABLE "BlockText" (
    "id_cms" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "texte" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockText_pkey" PRIMARY KEY ("id_cms")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlockText_code_key" ON "BlockText"("code");

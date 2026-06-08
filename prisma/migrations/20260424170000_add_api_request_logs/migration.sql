-- CreateTable
CREATE TABLE "ApiRequestLog" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "route" TEXT,
    "statusCode" INTEGER,
    "durationMs" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "clientIp" TEXT,
    "userAgent" TEXT,
    "contentLength" INTEGER,
    "clientId" TEXT,
    "subject" TEXT,
    "tokenType" TEXT,
    "audiences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requestHeaders" JSONB,
    "requestQuery" JSONB,
    "requestBody" JSONB,
    "errorName" TEXT,
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiRequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApiRequestLog_createdAt_idx" ON "ApiRequestLog"("createdAt");

-- CreateIndex
CREATE INDEX "ApiRequestLog_requestId_idx" ON "ApiRequestLog"("requestId");

-- CreateIndex
CREATE INDEX "ApiRequestLog_clientId_createdAt_idx" ON "ApiRequestLog"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "ApiRequestLog_method_statusCode_idx" ON "ApiRequestLog"("method", "statusCode");

-- CreateIndex
CREATE INDEX "ApiRequestLog_path_statusCode_idx" ON "ApiRequestLog"("path", "statusCode");

-- CreateIndex
CREATE INDEX "ApiRequestLog_success_createdAt_idx" ON "ApiRequestLog"("success", "createdAt");

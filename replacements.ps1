# Script pour générer les remplacements des entités HTML

$replacements = @(
    @{file="src/components/AIAssistant.tsx"; line=87; old="l'assistant intelligent"; new="l&apos;assistant intelligent"},
    @{file="src/components/AccountingManager.tsx"; line=421; old="l'Écriture"; new="l&apos;Écriture"},
    @{file="src/components/AccountingManager.tsx"; line=538; old="qu'on"; new="qu&apos;on"},
    @{file="src/components/AccountingManager.tsx"; line=544; old="d'où"; new="d&apos;où"},
    @{file="src/components/AccountingManager.tsx"; line=544; old="n'est"; new="n&apos;est"},
    @{file="src/components/AccountingManager.tsx"; line=554; old="n'est"; new="n&apos;est"},
    @{file="src/components/AccountingManager.tsx"; line=1151; old="à la"; new="à la"},
    @{file="src/components/AccountingManager.tsx"; line=1153; old="`"DURAND - FAC-2026-001`""; new="&quot;DURAND - FAC-2026-001&quot;"},
    @{file="src/components/AccountingManager.tsx"; line=1162; old="l'Écriture"; new="l&apos;Écriture"},
    @{file="src/components/AccountingManager.tsx"; line=1172; old="`"PRLV SAAS ADOBE`""; new="&quot;PRLV SAAS ADOBE&quot;"},
    @{file="src/components/Dashboard.tsx"; line=273; old="l'affichage"; new="l&apos;affichage"},
    @{file="src/components/Dashboard.tsx"; line=308; old="l'historique"; new="l&apos;historique"},
    @{file="src/components/ErrorBoundary.tsx"; line=50; old="n'existe"; new="n&apos;existe"},
    @{file="src/components/ErrorBoundary.tsx"; line=53; old="l'application"; new="l&apos;application"},
    @{file="src/components/ErrorBoundary.tsx"; line=68; old="l'application"; new="l&apos;application"}
)

Write-Host "Total replacements: $($replacements.Count)"

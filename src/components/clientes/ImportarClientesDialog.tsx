import { useMemo, useState } from "react";
import { FileSpreadsheet, Loader2, Upload, CheckCircle2, AlertTriangle, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";

import { parseSpreadsheetFile, type ParsedSpreadsheet } from "@/lib/import/parseFile";
import { IMPORT_FIELDS, autoDetectMapping, type ColumnMapping } from "@/lib/import/fields";
import { buildClientesFromRows, type ImportRowResult } from "@/lib/import/buildClientes";
import * as clientesService from "@/services/clientesService";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/utils/formatters";
import type { Servidor } from "@/types";

type Etapa = "upload" | "mapear" | "preview" | "resultado";

interface ImportarClientesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servidores: Servidor[];
  servidorIdFixo?: string;
  onImportado: () => void;
}

export function ImportarClientesDialog({
  open,
  onOpenChange,
  servidores,
  servidorIdFixo,
  onImportado,
}: ImportarClientesDialogProps) {
  const { user } = useAuth();
  const [etapa, setEtapa] = useState<Etapa>("upload");
  const [servidorId, setServidorId] = useState(servidorIdFixo ?? "");
  const [carregandoArquivo, setCarregandoArquivo] = useState(false);
  const [planilha, setPlanilha] = useState<ParsedSpreadsheet | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [processando, setProcessando] = useState(false);
  const [resultados, setResultados] = useState<ImportRowResult[]>([]);
  const [importando, setImportando] = useState(false);
  const [totalImportado, setTotalImportado] = useState(0);

  const resetar = () => {
    setEtapa("upload");
    setServidorId(servidorIdFixo ?? "");
    setPlanilha(null);
    setMapping({});
    setResultados([]);
    setTotalImportado(0);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) resetar();
    onOpenChange(nextOpen);
  };

  const handleArquivo = async (file: File) => {
    setCarregandoArquivo(true);
    try {
      const dados = await parseSpreadsheetFile(file);
      setPlanilha(dados);
      setMapping(autoDetectMapping(dados.headers));
      setEtapa("mapear");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao ler a planilha.");
    } finally {
      setCarregandoArquivo(false);
    }
  };

  const handleGerarPreview = async () => {
    if (!planilha || !servidorId) return;
    setProcessando(true);
    try {
      const existentes = await clientesService.buscarChavesExistentes(servidorId);
      const linhas = buildClientesFromRows(planilha.rows, mapping, servidorId, existentes, user?.id);
      setResultados(linhas);
      setEtapa("preview");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao processar a planilha.");
    } finally {
      setProcessando(false);
    }
  };

  const validos = useMemo(() => resultados.filter((r) => r.situacao === "ok"), [resultados]);
  const duplicados = useMemo(() => resultados.filter((r) => r.situacao === "duplicado"), [resultados]);
  const comErro = useMemo(() => resultados.filter((r) => r.situacao === "erro"), [resultados]);

  const handleImportar = async () => {
    setImportando(true);
    try {
      const clientes = validos.map((r) => r.cliente!);
      const total = await clientesService.importarClientes(clientes);
      setTotalImportado(total);
      setEtapa("resultado");
      onImportado();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao importar clientes.");
    } finally {
      setImportando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar clientes de uma planilha</DialogTitle>
        </DialogHeader>

        {etapa === "upload" && (
          <div className="space-y-4">
            {!servidorIdFixo && (
              <div className="space-y-2">
                <Label>Servidor de destino *</Label>
                <Select value={servidorId} onValueChange={setServidorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o servidor" />
                  </SelectTrigger>
                  <SelectContent>
                    {servidores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="arquivo-importacao">Arquivo (.xlsx ou .csv) *</Label>
              <label
                htmlFor="arquivo-importacao"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-10 text-center hover:bg-muted/50"
              >
                {carregandoArquivo ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                )}
                <p className="text-sm font-medium text-foreground">
                  {carregandoArquivo ? "Lendo planilha..." : "Clique para escolher o arquivo"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Exportações do WPlay, UniTV, TVS/P2P ou qualquer planilha com colunas de usuário e
                  vencimento
                </p>
                <input
                  id="arquivo-importacao"
                  type="file"
                  accept=".xlsx,.csv"
                  className="hidden"
                  disabled={!servidorId || carregandoArquivo}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleArquivo(file);
                    e.target.value = "";
                  }}
                />
              </label>
              {!servidorId && (
                <p className="text-xs text-muted-foreground">Selecione um servidor antes de escolher o arquivo.</p>
              )}
            </div>
          </div>
        )}

        {etapa === "mapear" && planilha && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Associe cada campo do Central Hub à coluna correspondente da sua planilha (
              <span className="font-medium text-foreground">{planilha.rows.length} linhas</span> encontradas).
            </p>
            <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
              {IMPORT_FIELDS.map((def) => (
                <div key={def.field} className="grid grid-cols-1 gap-1.5 sm:grid-cols-[minmax(0,180px)_1fr] sm:items-center sm:gap-3">
                  <Label>
                    {def.label}
                    {def.required && <span className="text-destructive"> *</span>}
                  </Label>
                  <Select
                    value={mapping[def.field] ?? "__none__"}
                    onValueChange={(v) =>
                      setMapping((prev) => ({ ...prev, [def.field]: v === "__none__" ? undefined : v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Não mapear" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Não mapear</SelectItem>
                      {planilha.headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )}

        {etapa === "preview" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Badge variant="outline" className="border-emerald-300 bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> {validos.length} prontos para importar
              </Badge>
              <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-800">
                <Copy className="mr-1 h-3.5 w-3.5" /> {duplicados.length} duplicados (serão ignorados)
              </Badge>
              <Badge variant="outline" className="border-red-300 bg-red-100 text-red-800">
                <AlertTriangle className="mr-1 h-3.5 w-3.5" /> {comErro.length} com erro (serão ignorados)
              </Badge>
            </div>

            <div className="max-h-[45vh] overflow-y-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">Linha</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultados.map((r) => (
                    <TableRow key={r.linha}>
                      <TableCell className="text-xs text-muted-foreground">{r.linha}</TableCell>
                      <TableCell className="max-w-[160px] truncate">{r.preview.nome}</TableCell>
                      <TableCell>{r.preview.usuario || "-"}</TableCell>
                      <TableCell>{r.preview.dataExpiracao ? formatDate(r.preview.dataExpiracao) : "-"}</TableCell>
                      <TableCell>{r.preview.status || "-"}</TableCell>
                      <TableCell>
                        {r.situacao === "ok" && (
                          <Badge variant="outline" className="border-emerald-300 bg-emerald-100 text-emerald-800">
                            OK
                          </Badge>
                        )}
                        {r.situacao === "duplicado" && (
                          <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-800">
                            Duplicado
                          </Badge>
                        )}
                        {r.situacao === "erro" && (
                          <Badge
                            variant="outline"
                            className="border-red-300 bg-red-100 text-red-800"
                            title={r.motivo}
                          >
                            Erro
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {etapa === "resultado" && (
          <div className="py-4">
            <EmptyState
              icon={CheckCircle2}
              title="Importação concluída"
              description={`${totalImportado} cliente(s) importado(s) com sucesso. ${duplicados.length} duplicado(s) e ${comErro.length} com erro foram ignorados.`}
            />
          </div>
        )}

        <DialogFooter>
          {etapa === "mapear" && (
            <>
              <Button variant="outline" onClick={() => setEtapa("upload")} disabled={processando}>
                Voltar
              </Button>
              <Button onClick={handleGerarPreview} disabled={processando}>
                {processando && <Loader2 className="h-4 w-4 animate-spin" />}
                Pré-visualizar
              </Button>
            </>
          )}

          {etapa === "preview" && (
            <>
              <Button variant="outline" onClick={() => setEtapa("mapear")} disabled={importando}>
                Voltar
              </Button>
              <Button onClick={handleImportar} disabled={importando || validos.length === 0}>
                {importando && <Loader2 className="h-4 w-4 animate-spin" />}
                <FileSpreadsheet className="h-4 w-4" />
                Importar {validos.length} cliente(s)
              </Button>
            </>
          )}

          {etapa === "resultado" && <Button onClick={() => handleClose(false)}>Concluir</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

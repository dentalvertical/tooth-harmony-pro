import { useI18n } from "@/shared/i18n";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Edit, Trash2 } from "lucide-react";
import type { Patient } from "../types";

interface PatientTableProps {
  patients: Patient[];
  onView: (patient: Patient) => void;
  onEdit: (patient: Patient) => void;
  onDelete: (id: string) => void;
}

export function PatientTable({ patients, onView, onEdit, onDelete }: PatientTableProps) {
  const { t } = useI18n();

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("patients.name")}</TableHead>
            <TableHead>{t("patients.phone")}</TableHead>
            <TableHead className="hidden md:table-cell">{t("patients.email")}</TableHead>
            <TableHead className="hidden md:table-cell">{t("patients.lastVisit")}</TableHead>
            <TableHead className="text-right">{t("patients.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((p) => (
            <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell className="font-medium">{p.fullName}</TableCell>
              <TableCell>{p.phone}</TableCell>
              <TableCell className="hidden md:table-cell">{p.email}</TableCell>
              <TableCell className="hidden md:table-cell">{p.lastVisit}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onView(p)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(p)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(p.id)} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

import { useState } from "react";
import { ArrowLeft, Plus, Save } from "lucide-react";
import { Badge, Input, Line, Metric, Modal, Panel, SelectField, TableWrap } from "../components/ui";
import { roles } from "../lib/validation";

export function EquipePage({
  tenant,
  inviteForm,
  setInviteForm,
  members,
  invites,
  saving,
  errors,
  handleInviteSubmit,
  updateMemberRole,
  updateMemberStatus,
  updateInviteStatus,
}) {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [view, setView] = useState("list");
  const activeMembers = members.filter((member) => member.status !== "blocked").length;
  const blockedMembers = members.filter((member) => member.status === "blocked").length;
  const pendingInvites = invites.filter((invite) => invite.status === "pending").length;
  const managers = members.filter((member) => member.role === "manager").length;

  async function submitInvite(event) {
    const ok = await handleInviteSubmit(event);
    if (ok !== false) setView("list");
  }

  if (view === "form") {
    return (
      <Panel
        title="Novo usuário"
        actions={
          <button type="button" onClick={() => setView("list")} className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-black text-neutral-700">
            <ArrowLeft size={16} /> Voltar
          </button>
        }
      >
        <form className="grid gap-3" onSubmit={submitInvite}>
            <Input label="Nome" value={inviteForm.name} onChange={(value) => setInviteForm({ ...inviteForm, name: value })} placeholder="Nome do colaborador" />
            <Input label="E-mail" type="email" required value={inviteForm.email} onChange={(value) => setInviteForm({ ...inviteForm, email: value })} error={errors.inviteEmail} />
            <SelectField label="Nivel" value={inviteForm.role} onChange={(value) => setInviteForm({ ...inviteForm, role: value })}>
              <option value="manager">Gerente</option>
              <option value="cashier">Caixa/Atendente</option>
            </SelectField>
            <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-3 text-sm font-black text-white disabled:opacity-60">
              <Save size={16} /> Gerar convite
            </button>
          </form>
      </Panel>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric title="Ativos" value={activeMembers} detail="Usuarios liberados" tone="emerald" />
          <Metric title="Bloqueados" value={blockedMembers} detail="Acesso suspenso" tone={blockedMembers ? "danger" : "neutral"} />
          <Metric title="Convites" value={pendingInvites} detail="Aguardando aceite" tone="amber" />
          <Metric title="Gerentes" value={managers} detail="Acesso administrativo" tone="sky" />
        </div>

        <Panel
          title={`Equipe de ${tenant?.name || "loja"}`}
          actions={
            <button type="button" onClick={() => setView("form")} className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-3 text-sm font-black text-white">
              <Plus size={16} /> Novo usuário
            </button>
          }
        >
          <TableWrap>
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Papel</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {members.map((member) => (
                  <tr key={member.id} onClick={() => setSelectedRecord({ type: "member", data: member })} className="cursor-pointer transition hover:bg-sky-50/60">
                    <td className="px-4 py-3">
                      <p className="font-black">{member.name || member.email}</p>
                      <p className="text-xs text-neutral-500">{member.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-neutral-700">{roles[member.role]}</span>
                      <select
                        value={member.role}
                        onChange={(event) => updateMemberRole(member.id, event.target.value)}
                        disabled={member.role === "owner"}
                        className="hidden rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-bold"
                      >
                        <option value="owner">Dono/Admin</option>
                        <option value="manager">Gerente</option>
                        <option value="cashier">Caixa/Atendente</option>
                      </select>
                    </td>
                    <td className="px-4 py-3"><Badge tone={member.status === "blocked" ? "danger" : "success"}>{member.status === "blocked" ? "Bloqueado" : "Ativo"}</Badge></td>
                    <td className="px-4 py-3">
                      <span className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-black text-sky-700">Abrir</span>
                    </td>
                  </tr>
                ))}
                {invites.map((invite) => (
                  <tr key={invite.id} onClick={() => setSelectedRecord({ type: "invite", data: invite })} className="cursor-pointer transition hover:bg-sky-50/60">
                    <td className="px-4 py-3">
                      <p className="font-black">{invite.name || invite.email}</p>
                      <p className="text-xs text-neutral-500">{invite.email}</p>
                    </td>
                    <td className="px-4 py-3">{roles[invite.role]}</td>
                    <td className="px-4 py-3">
                      <Badge tone={invite.status === "accepted" ? "success" : invite.status === "canceled" ? "danger" : "amber"}>
                        {invite.status === "accepted" ? "Aceito" : invite.status === "canceled" ? "Cancelado" : "Pendente"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-black text-sky-700">Abrir</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      </div>

      <Modal title="Detalhes da equipe" open={Boolean(selectedRecord)} onClose={() => setSelectedRecord(null)}>
        {selectedRecord && (
          <div className="grid gap-4">
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xl font-black">{selectedRecord.data.name || selectedRecord.data.email}</p>
              <p className="text-sm font-semibold text-neutral-500">{selectedRecord.data.email}</p>
            </div>
            <div className="grid gap-2">
              <Line label="Tipo" value={selectedRecord.type === "member" ? "Usuario" : "Convite"} />
              <Line label="Cargo" value={roles[selectedRecord.data.role] || selectedRecord.data.role} />
              <Line label="Status" value={selectedRecord.data.status === "blocked" ? "Bloqueado" : selectedRecord.data.status === "canceled" ? "Cancelado" : selectedRecord.data.status === "accepted" ? "Aceito" : "Ativo/Pendente"} />
            </div>
            {selectedRecord.type === "member" && selectedRecord.data.role !== "owner" && (
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <SelectField label="Alterar cargo" value={selectedRecord.data.role} onChange={(value) => {
                  updateMemberRole(selectedRecord.data.id, value);
                  setSelectedRecord({ ...selectedRecord, data: { ...selectedRecord.data, role: value } });
                }}>
                  <option value="manager">Gerente</option>
                  <option value="cashier">Caixa/Atendente</option>
                </SelectField>
                <button
                  type="button"
                  onClick={() => {
                    const nextStatus = selectedRecord.data.status === "blocked" ? "active" : "blocked";
                    updateMemberStatus(selectedRecord.data.id, nextStatus);
                    setSelectedRecord({ ...selectedRecord, data: { ...selectedRecord.data, status: nextStatus } });
                  }}
                  className="self-end rounded-lg border border-neutral-300 px-4 py-3 text-sm font-black text-neutral-700"
                >
                  {selectedRecord.data.status === "blocked" ? "Reativar" : "Bloquear"}
                </button>
              </div>
            )}
            {selectedRecord.type === "invite" && selectedRecord.data.status === "pending" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    updateInviteStatus(selectedRecord.data.id, "canceled");
                    setSelectedRecord(null);
                  }}
                  className="rounded-lg border border-red-200 px-4 py-3 text-sm font-black text-red-700"
                >
                  Cancelar convite
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

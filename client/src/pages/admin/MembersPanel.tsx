import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/QueryErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Check, Copy, Loader2, Plus, Search, Send, Settings2 } from "lucide-react";
import { useState } from "react";

type Tier = "silver" | "gold" | "platinum" | "custom";
type MembershipStatus = "pending" | "active" | "paused" | "cancelled" | "expired";
type AccountStatus = "invited" | "active" | "suspended";

export function dateInputToUtcEnd(value: string) {
  return value ? new Date(`${value}T23:59:59.999Z`) : null;
}

function dateToInput(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

export function MembersPanel() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(
    () => import.meta.env.DEV && new URLSearchParams(window.location.search).get("dialog") === "invite"
  );
  const members = trpc.admin.members.list.useQuery(search.trim() ? { search: search.trim() } : undefined);

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Access and invitations</p>
          <h2 className="mt-2 font-serif text-3xl text-[#243f4d]">Members</h2>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button className="w-full rounded-full bg-[#2f7772] px-6 text-white hover:bg-[#245f5c] sm:w-auto"><Plus className="mr-2 size-4" /> Invite member</Button></DialogTrigger>
          <CreateMemberDialog onComplete={() => setCreateOpen(false)} />
        </Dialog>
      </div>

      <div className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by name or email" className="h-11 rounded-full border-[#ddd3c0] bg-[#fffdf8] pl-10" />
      </div>

      <div className="mt-6">
        {members.error ? <QueryErrorState title="Members could not be loaded" onRetry={() => void members.refetch()} /> : members.isLoading ? <Skeleton className="h-80 rounded-[1.5rem]" /> : members.data?.length ? (
          <>
            <div className="space-y-3 md:hidden">
              {members.data.map(row => (
                <article key={row.user.id} className="editorial-card rounded-[1.5rem] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-[#243f4d]">{row.user.name || "Unnamed member"}</p>
                      <p className="mt-1 break-all text-xs leading-5 text-muted-foreground">{row.user.email}</p>
                    </div>
                    {row.user.role === "admin" ? <Badge variant="outline">Administrator</Badge> : <MemberActions row={row} compact />}
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#ebe3d5] pt-4 text-center">
                    <div><p className="text-[9px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Tier</p><p className="mt-1 text-xs capitalize text-[#415860]">{row.membership?.tier || "—"}</p></div>
                    <div><p className="text-[9px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Membership</p><div className="mt-1"><StatusBadge status={row.membership?.status || "pending"} /></div></div>
                    <div><p className="text-[9px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Account</p><div className="mt-1"><StatusBadge status={row.user.accountStatus} /></div></div>
                  </div>
                </article>
              ))}
            </div>
            <div className="editorial-card hidden overflow-x-auto rounded-[1.5rem] md:block">
              <Table>
                <TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Tier</TableHead><TableHead>Membership</TableHead><TableHead>Account</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {members.data.map(row => (
                    <TableRow key={row.user.id}>
                      <TableCell><p className="font-medium text-[#243f4d]">{row.user.name || "Unnamed member"}</p><p className="mt-1 text-xs text-muted-foreground">{row.user.email}</p></TableCell>
                      <TableCell className="capitalize">{row.membership?.tier || "—"}</TableCell>
                      <TableCell><StatusBadge status={row.membership?.status || "pending"} /></TableCell>
                      <TableCell><StatusBadge status={row.user.accountStatus} /></TableCell>
                      <TableCell className="text-right">
                        {row.user.role === "admin" ? <Badge variant="outline">Administrator</Badge> : <MemberActions row={row} />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : <EmptyState eyebrow="Member access" title="No members found" description={search ? "Try a different name or email." : "Invite Susan’s first client to create a private member account."} />}
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "active";
  const caution = status === "pending" || status === "invited" || status === "paused";
  return <Badge className={active ? "bg-[#e7f0ec] text-[#246866] hover:bg-[#e7f0ec]" : caution ? "bg-[#f4ead0] text-[#77580f] hover:bg-[#f4ead0]" : "bg-[#f4e5e9] text-[#8a435d] hover:bg-[#f4e5e9]"}>{status.replaceAll("_", " ")}</Badge>;
}

function CreateMemberDialog({ onComplete }: { onComplete: () => void }) {
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<Tier>("silver");
  const [membershipStatus, setMembershipStatus] = useState<"pending" | "active">("active");
  const [endsAt, setEndsAt] = useState("");
  const [invitation, setInvitation] = useState<{ invitationUrl: string; expiresAt: Date } | null>(null);
  const [copied, setCopied] = useState(false);
  const create = trpc.admin.members.create.useMutation({
    onSuccess: result => {
      setInvitation(result);
      void utils.admin.members.list.invalidate();
      void utils.admin.overview.invalidate();
    },
  });

  return (
    <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-[1.5rem] p-5 sm:p-6">
      <DialogHeader className="pr-6"><DialogTitle className="font-serif text-2xl sm:text-3xl">{invitation ? "Invitation ready" : "Invite a member"}</DialogTitle><DialogDescription>{invitation ? "Copy this private setup link and send it to the member. It expires automatically." : "Create the account, choose access, and generate a one-time setup link."}</DialogDescription></DialogHeader>
      {invitation ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-[#c9a84c]/45 bg-[#f7f1df] p-4"><p className="break-all text-sm text-[#675927]">{invitation.invitationUrl}</p></div>
          <p className="text-xs text-muted-foreground">Expires {new Date(invitation.expiresAt).toLocaleString()}.</p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="outline" className="rounded-full" onClick={onComplete}>Done</Button><Button className="rounded-full bg-[#2f7772] text-white hover:bg-[#245f5c]" onClick={async () => { await navigator.clipboard.writeText(invitation.invitationUrl); setCopied(true); }} >{copied ? <Check className="mr-2 size-4" /> : <Copy className="mr-2 size-4" />}{copied ? "Copied" : "Copy invitation"}</Button></div>
        </div>
      ) : (
        <form className="mt-4 space-y-5" onSubmit={event => { event.preventDefault(); create.mutate({ name, email, tier, membershipStatus, endsAt: dateInputToUtcEnd(endsAt) }); }}>
          <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="member-name">Name</Label><Input id="member-name" required value={name} onChange={event => setName(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="member-email">Email</Label><Input id="member-email" type="email" required value={email} onChange={event => setEmail(event.target.value)} /></div></div>
          <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label>Tier</Label><Select value={tier} onValueChange={value => setTier(value as Tier)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="silver">Silver</SelectItem><SelectItem value="gold">Gold</SelectItem><SelectItem value="platinum">Platinum</SelectItem><SelectItem value="custom">Custom</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Membership</Label><Select value={membershipStatus} onValueChange={value => setMembershipStatus(value as "pending" | "active")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent></Select></div></div>
          <div className="space-y-2"><Label htmlFor="member-expiration">Access end date</Label><Input id="member-expiration" type="date" value={endsAt} onChange={event => setEndsAt(event.target.value)} /><p className="text-xs text-muted-foreground">Leave blank for access without a scheduled expiration.</p></div>
          {create.error ? <p role="alert" className="rounded-xl bg-[#fff8f4] p-3 text-sm text-[#823b32]">{create.error.message}</p> : null}
          <div className="flex justify-end"><Button disabled={create.isPending} className="w-full rounded-full bg-[#2f7772] px-6 text-white hover:bg-[#245f5c] sm:w-auto">{create.isPending ? <Loader2 className="size-4 animate-spin" /> : <><Send className="mr-2 size-4" /> Create invitation</>}</Button></div>
        </form>
      )}
    </DialogContent>
  );
}

function MemberActions({ row, compact = false }: { row: any; compact?: boolean }) {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [accountStatus, setAccountStatus] = useState<AccountStatus>(row.user.accountStatus);
  const [tier, setTier] = useState<Tier>(row.membership?.tier || "silver");
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus>(row.membership?.status || "pending");
  const [endsAt, setEndsAt] = useState(dateToInput(row.membership?.endsAt));
  const [notes, setNotes] = useState(row.membership?.internalNotes || "");
  const [invitation, setInvitation] = useState<string | null>(null);
  const update = trpc.admin.members.updateAccess.useMutation({ onSuccess: () => { void utils.admin.members.list.invalidate(); void utils.admin.overview.invalidate(); setOpen(false); } });
  const refresh = trpc.admin.members.refreshInvitation.useMutation({ onSuccess: result => setInvitation(result.invitationUrl) });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant={compact ? "outline" : "ghost"} size="sm" className={compact ? "rounded-full bg-white px-3" : undefined}><Settings2 className={compact ? "size-4" : "mr-2 size-4"} /><span className={compact ? "sr-only" : undefined}>Manage</span></Button></DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-[1.5rem] p-5 sm:p-6">
        <DialogHeader className="pr-6"><DialogTitle className="font-serif text-2xl sm:text-3xl">Manage {row.user.name || row.user.email}</DialogTitle><DialogDescription>Change entitlement independently from the login account state.</DialogDescription></DialogHeader>
        <div className="grid gap-5 pt-3 sm:grid-cols-2"><div className="space-y-2"><Label>Account</Label><Select value={accountStatus} onValueChange={value => setAccountStatus(value as AccountStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="invited">Invited</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Tier</Label><Select value={tier} onValueChange={value => setTier(value as Tier)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="silver">Silver</SelectItem><SelectItem value="gold">Gold</SelectItem><SelectItem value="platinum">Platinum</SelectItem><SelectItem value="custom">Custom</SelectItem></SelectContent></Select></div></div>
        <div className="space-y-2"><Label>Membership status</Label><Select value={membershipStatus} onValueChange={value => setMembershipStatus(value as MembershipStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="paused">Paused</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem><SelectItem value="expired">Expired</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label htmlFor={`expiration-${row.user.id}`}>Access end date</Label><Input id={`expiration-${row.user.id}`} type="date" value={endsAt} onChange={event => setEndsAt(event.target.value)} /><p className="text-xs text-muted-foreground">Leave blank to remove the scheduled expiration.</p></div>
        <div className="space-y-2"><Label htmlFor={`notes-${row.user.id}`}>Private notes</Label><Textarea id={`notes-${row.user.id}`} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Only administrators can see these notes." /></div>
        {invitation ? <div className="rounded-xl bg-[#f7f1df] p-3"><p className="break-all text-xs text-[#675927]">{invitation}</p><Button variant="ghost" size="sm" className="mt-2" onClick={() => navigator.clipboard.writeText(invitation)}><Copy className="mr-2 size-3" /> Copy</Button></div> : null}
        {update.error || refresh.error ? <p role="alert" className="text-sm text-[#823b32]">{update.error?.message || refresh.error?.message}</p> : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between"><Button variant="outline" className="rounded-full" disabled={refresh.isPending} onClick={() => refresh.mutate({ userId: row.user.id })}>{refresh.isPending ? <Loader2 className="size-4 animate-spin" /> : <><Send className="mr-2 size-4" /> New invitation link</>}</Button><Button className="rounded-full bg-[#2f7772] px-6 text-white hover:bg-[#245f5c]" disabled={update.isPending} onClick={() => update.mutate({ userId: row.user.id, accountStatus, tier, membershipStatus, endsAt: dateInputToUtcEnd(endsAt), internalNotes: notes || null })}>{update.isPending ? <Loader2 className="size-4 animate-spin" /> : "Save access"}</Button></div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, ErrorState, LoadingState } from "@/components/ui";
import { useActor } from "@/components/actor-context";
import { apiFetch } from "@/lib/api";
import { createPurchaseRequestSchema } from "@/lib/contracts";
import { useResource } from "@/lib/use-resource";
import type { Department, PurchaseRequest } from "@/lib/types";

export default function NewRequestPage() {
  const router=useRouter(); const {actor}=useActor(); const departments=useResource<Department[]>("/api/procurement/departments");
  const [form,setForm]=useState({title:"",description:"",businessJustification:"",departmentId:"",costCenterCode:"",currency:"USD",neededByDate:""});
  const [error,setError]=useState<unknown>(); const [saving,setSaving]=useState(false); const [errors,setErrors]=useState<Record<string,string>>({});
  const update=(key:string,value:string)=>setForm(current=>({...current,[key]:value}));
  async function submit(event:React.FormEvent){event.preventDefault();const parsed=createPurchaseRequestSchema.safeParse(form);if(!parsed.success){setErrors(Object.fromEntries(parsed.error.issues.map(i=>[String(i.path[0]),i.message])));return}setErrors({});setSaving(true);setError(undefined);try{const created=await apiFetch<PurchaseRequest>("/api/procurement/requests",{method:"POST",body:parsed.data,actor});router.push(`/requests/${created.id}`)}catch(reason){setError(reason)}finally{setSaving(false)}}
  return <><PageHeader eyebrow="New demand" title="Create purchase request" description="Capture the business need now; line items can be added before submission."/>{departments.loading?<LoadingState/>:departments.error?<ErrorState error={departments.error} retry={departments.reload}/>:<form className="panel panel-body" onSubmit={submit}>{Boolean(error)&&<ErrorState error={error}/>}<div className="form-grid">
    <Field label="Request title" error={errors.title}><input value={form.title} onChange={e=>update("title",e.target.value)} required/></Field>
    <Field label="Department" error={errors.departmentId}><select value={form.departmentId} onChange={e=>update("departmentId",e.target.value)} required><option value="">Choose department</option>{departments.data?.filter(d=>d.active).map(d=><option key={d.id} value={d.id}>{d.code} · {d.name}</option>)}</select></Field>
    <Field label="Cost center" error={errors.costCenterCode}><input value={form.costCenterCode} onChange={e=>update("costCenterCode",e.target.value)} required/></Field>
    <Field label="Currency" error={errors.currency}><input value={form.currency} maxLength={3} onChange={e=>update("currency",e.target.value.toUpperCase())} required/></Field>
    <Field label="Needed by" error={errors.neededByDate}><input type="date" value={form.neededByDate} onChange={e=>update("neededByDate",e.target.value)} required/></Field>
    <Field label="Description" full error={errors.description}><textarea value={form.description} onChange={e=>update("description",e.target.value)}/></Field>
    <Field label="Business justification" full error={errors.businessJustification}><textarea value={form.businessJustification} onChange={e=>update("businessJustification",e.target.value)} required/></Field>
  </div><div className="form-actions"><button type="button" className="button secondary" onClick={()=>router.back()}>Cancel</button><button className="button primary" disabled={saving}>{saving?"Creating…":"Create draft"}</button></div></form>}</>;
}
function Field({label,error,full,children}:{label:string;error?:string;full?:boolean;children:React.ReactNode}){return <label className={`field ${full?"full":""}`}><span>{label}</span>{children}{error&&<span className="field-error">{error}</span>}</label>}

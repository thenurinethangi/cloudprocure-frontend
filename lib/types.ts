export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
};

export type PurchaseRequestItem = {
  id: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  estimatedTotal: number;
  preferredSupplierId?: string;
  notes?: string;
};

export type ApprovalDecision = {
  id: string;
  decision: string;
  approverName: string;
  approverEmail: string;
  reason?: string;
  decidedAt: string;
};

export type PurchaseRequest = {
  id: string;
  requestNumber: string;
  title: string;
  description?: string;
  businessJustification: string;
  departmentId: string;
  costCenterCode: string;
  requesterName: string;
  requesterEmail: string;
  currency: string;
  estimatedTotal: number;
  neededByDate: string;
  status: string;
  selectedSupplierId?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  items: PurchaseRequestItem[];
  approvalDecisions: ApprovalDecision[];
};

export type Department = { id: string; code: string; name: string; description?: string; active: boolean };

export type Attachment = {
  id: string;
  purchaseRequestId: string;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedBy: string;
  uploadedAt: string;
};

export type Supplier = {
  id: string;
  code: string;
  name: string;
  legalName?: string;
  registrationNumber?: string;
  status: string;
  rating?: number;
  categories: string[];
  contacts?: Array<{ name: string; jobTitle?: string; email?: string; phone?: string; primary?: boolean }>;
  address?: Record<string, string>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type CatalogItem = {
  id: string;
  supplierId: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  price: number;
  currency: string;
  active: boolean;
};

export type OrderItem = {
  id: string;
  sourceRequestItemId: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  receivedQuantity: number;
};

export type GoodsReceipt = {
  id: string;
  receiptNumber: string;
  receivedBy: string;
  receivedAt: string;
  notes?: string;
  items: Array<{ id: string; purchaseOrderItemId: string; quantityReceived: number; notes?: string }>;
};

export type PurchaseOrder = {
  id: string;
  poNumber: string;
  purchaseRequestId: string;
  supplierId: string;
  supplierNameSnapshot: string;
  supplierCodeSnapshot: string;
  currency: string;
  totalAmount: number;
  expectedDeliveryDate: string;
  status: string;
  procurementSyncStatus: "SYNCED" | "PENDING";
  createdBy: string;
  issuedBy?: string;
  issuedAt?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  closedBy?: string;
  closedAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  goodsReceipts: GoodsReceipt[];
};

export type ActivityEvent = {
  id: string;
  service: string;
  eventType: string;
  entityType: string;
  entityId: string;
  actor: string;
  summary: string;
  metadata: Record<string, unknown>;
  occurredAt: string;
};

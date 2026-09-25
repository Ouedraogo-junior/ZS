// src/lib/api/dashboard.ts

import { apiFetch } from './client'

export interface TendanceJour {
  date: string
  depots: number
  retraits: number
}

export interface GerantDashboard {
  volume_depots_jour: number
  volume_retraits_jour: number
  transactions_jour: number
  agents_actifs: number
  agents_total: number
  reclamations_en_attente: number
  tendance_7_jours: TendanceJour[]
}

export function getGerantDashboard(): Promise<GerantDashboard> {
  return apiFetch('/staff/dashboard')
}

export interface AgenceComparaison {
  agence_id: number
  agence: string
  volume: number
  transactions: number
}

export interface AdminDashboard {
  volume_jour: number
  transactions_jour: number
  agences_actives: number
  agents_actifs: number
  reclamations_en_attente: number
  comparatif_agences: AgenceComparaison[]
  tendance_7_jours: TendanceJour[]
}

export function getAdminDashboard(): Promise<AdminDashboard> {
  return apiFetch('/admin/dashboard')
}
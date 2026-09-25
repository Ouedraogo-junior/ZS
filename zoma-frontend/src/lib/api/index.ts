// src/lib/api/index.ts
//
// Point d'entrée unique : réexporte chaque domaine, pour que les écrans
// continuent d'importer depuis '@/lib/api' sans rien changer. En ajouter
// un (ex. releves.ts, avis.ts) = créer le fichier + une ligne ici.

export * from './client'
export * from './auth'
export * from './reference'
export * from './transactions'
export * from './releves'
export * from './staffAgents'
export * from './staffUsers'
export * from './avis'
export * from './reclamations'
export * from './dashboard'
export * from './staffTransactions'
export * from './config'
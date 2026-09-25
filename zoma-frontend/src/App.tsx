// src/App.tsx
//
// Racine : le site public (accessible sans connexion) et l'espace
// authentifié (agent/gérant/admin, derrière /connexion) sont maintenant
// deux branches distinctes — voir AuthenticatedApp.tsx pour l'ancien
// contenu de ce fichier.
import { Route, Routes } from 'react-router-dom'
import PublicApp from './pages/public/PublicApp'
import AuthenticatedApp from './AuthenticatedApp'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicApp />} />
      <Route path="/connexion" element={<AuthenticatedApp />} />
    </Routes>
  )
}
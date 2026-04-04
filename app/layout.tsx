import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ProManager - Gestión de Proyectos',
  description: 'Sistema profesional de gestión de proyectos para contratistas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  )
}

/// <reference types="vinxi/types/client" />
import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/start'
import { createRouter } from './router'

const router = createRouter()

// @ts-expect-error TanStack Start router types
hydrateRoot(document, <StartClient router={router} />)

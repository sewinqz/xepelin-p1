import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

export interface Operation {
  idOp: number
  tasa: number
}

export const getOperationsFn = httpsCallable<void, { operations: Operation[] }>(
  functions,
  'getOperations'
)

export const updateTasaFn = httpsCallable<
  { idOp: number; tasa: number },
  { success: boolean }
>(functions, 'updateTasa')

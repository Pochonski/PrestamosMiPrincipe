import * as clientesService from '../../services/clientes';
import {
  validateNombre,
  validateDireccion,
  validateTelefono,
  validateCedula,
  formatTelefonoLive,
  formatCedulaLive,
  validateCliente as validateAll,
  hasClienteErrors as hasErrors,
} from '../../lib/validators/cr';

export {
  validateNombre,
  validateDireccion,
  validateTelefono,
  validateCedula,
  formatTelefonoLive,
  formatCedulaLive,
  validateAll,
  hasErrors,
};

export function search(query) {
  return clientesService.buscar(query);
}
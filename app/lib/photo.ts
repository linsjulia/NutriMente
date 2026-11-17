/**
 * Foto de perfil enviada pelo usuário (/api/users/{id}/photo) pode ser
 * privada (paciente, profissional em análise): a API só entrega com o cookie
 * de login. O otimizador do <Image> busca a imagem pelo servidor, sem esse
 * cookie, então nesses casos a imagem vai direto do navegador:
 *   <Image src={url} unoptimized={isUploadedPhoto(url)} ... />
 * Fotos estáticas (/doctor/..., /patient/...) continuam otimizadas.
 */
export const isUploadedPhoto = (src: string | null | undefined) => !!src && src.startsWith("/api/users/");

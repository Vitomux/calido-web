<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function respond(bool $success, string $message): void
{
	http_response_code($success ? 200 : 400);
	echo json_encode(['success' => $success, 'message' => $message]);
	exit;
}

function sanitizeHeaderValue(string $value): string
{
	return trim(str_replace(["\r", "\n"], '', $value));
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	respond(false, 'Método no permitido.');
}

// Honeypot: bots tend to fill every field they find, real users never see this one.
$honeypot = trim((string) ($_POST['website'] ?? ''));
if ($honeypot !== '') {
	respond(false, 'Solicitud rechazada.');
}

$nombre = trim((string) ($_POST['nombre'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$mensaje = trim((string) ($_POST['mensaje'] ?? ''));

if ($nombre === '' || $email === '' || $mensaje === '') {
	respond(false, 'Completá todos los campos.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
	respond(false, 'El email no es válido.');
}

$destinatario = 'contacto@tudominio.com';

$nombreSeguro = sanitizeHeaderValue($nombre);
$emailSeguro = sanitizeHeaderValue($email);

$asunto = 'Nuevo mensaje de contacto de ' . $nombreSeguro;
$cuerpo = "Nombre: {$nombreSeguro}\nEmail: {$emailSeguro}\n\nMensaje:\n{$mensaje}";
$headers = "From: web@tudominio.com\r\n"
	. "Reply-To: {$emailSeguro}\r\n"
	. 'Content-Type: text/plain; charset=UTF-8';

$enviado = mail($destinatario, $asunto, $cuerpo, $headers);

if ($enviado) {
	respond(true, 'Mensaje enviado con éxito.');
}

respond(false, 'No se pudo enviar el mensaje. Intentá de nuevo más tarde.');

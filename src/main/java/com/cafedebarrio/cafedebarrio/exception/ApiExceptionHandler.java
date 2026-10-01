package com.cafedebarrio.cafedebarrio.exception;


import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.dao.*;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import java.util.*;
@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    ResponseEntity<ErrorBody> oversized(Exception ex) {
        return ResponseEntity.status(413).body(new ErrorBody("Selecciona una imagen de hasta 5 MB", Map.of()));
    }
    public record ErrorBody(String message, Map<String,String> fields) {}
    @ExceptionHandler(ApiException.class)
    ResponseEntity<ErrorBody> domain(ApiException ex) { return ResponseEntity.status(ex.status).body(new ErrorBody(ex.getMessage(), Map.of())); }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorBody> validation(MethodArgumentNotValidException ex) {
        Map<String,String> errors=new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(e -> errors.putIfAbsent(e.getField(), e.getDefaultMessage()));
        return ResponseEntity.badRequest().body(new ErrorBody("Revisa los campos del formulario", errors));
    }
    @ExceptionHandler({HttpMessageNotReadableException.class, HandlerMethodValidationException.class,
        org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class,
        org.springframework.web.bind.MissingRequestHeaderException.class,
        org.springframework.web.bind.MissingServletRequestParameterException.class})
    ResponseEntity<ErrorBody> badInput(Exception ex) { return ResponseEntity.badRequest().body(new ErrorBody("Solicitud inválida", Map.of())); }
    @ExceptionHandler({DataIntegrityViolationException.class, PessimisticLockingFailureException.class})
    ResponseEntity<ErrorBody> conflict(Exception ex) { return ResponseEntity.status(409).body(new ErrorBody("Los datos cambiaron. Actualiza e inténtalo nuevamente", Map.of())); }
}

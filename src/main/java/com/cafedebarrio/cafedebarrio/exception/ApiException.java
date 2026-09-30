package com.cafedebarrio.cafedebarrio.exception;


import org.springframework.http.HttpStatus;
public class ApiException extends RuntimeException {
    public final HttpStatus status;
    public ApiException(HttpStatus status, String message) { super(message); this.status=status; }
    public static ApiException missing(String what) { return new ApiException(HttpStatus.NOT_FOUND, what + " no encontrado"); }
    public static ApiException conflict(String message) { return new ApiException(HttpStatus.CONFLICT, message); }
}

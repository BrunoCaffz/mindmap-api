package io.github.brunocaffz.mindmap_api.auth.controller;

import io.github.brunocaffz.mindmap_api.auth.NotionPrincipal;
import io.github.brunocaffz.mindmap_api.shared.exception.UnauthenticatedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MeController {

    @GetMapping("/api/me")
    public MeResponse me(@AuthenticationPrincipal NotionPrincipal principal) {
        // O SecurityConfig já barra anônimos com 401; isto é só uma segunda trava.
        if (principal == null) {
            throw new UnauthenticatedException();
        }
        return new MeResponse(principal.userName(), principal.workspaceName());
    }
}

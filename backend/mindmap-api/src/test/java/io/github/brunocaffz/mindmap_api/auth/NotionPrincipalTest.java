package io.github.brunocaffz.mindmap_api.auth;

import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NotionPrincipalTest {

    @Test
    void authenticationNameIsTheUserIdAndFitsTheSessionColumn() {
        // A coluna PRINCIPAL_NAME do Spring Session tem 100 caracteres. Já deu erro em produção local quando o
        // nome era o toString do record, mesmo com nomes comuns.
        NotionPrincipal principal = new NotionPrincipal(UUID.randomUUID().toString(), "Ana de Souza Pereira Lima",
                UUID.randomUUID().toString(), "Workspace com um nome razoavelmente comprido da Empresa");
        var authentication = UsernamePasswordAuthenticationToken.authenticated(
                principal, null, AuthorityUtils.createAuthorityList("ROLE_USER"));

        assertEquals(principal.userId(), authentication.getName());
        assertTrue(authentication.getName().length() <= 100);
        assertTrue(principal.toString().length() > 100, "o toString é longo: por isso o getName() não pode depender dele");
    }

    @Test
    void survivesJavaSerializationBecauseTheSessionStoresItThatWay() throws Exception {
        NotionPrincipal principal = new NotionPrincipal("user-1", "Ana", "ws-1", "Meu Workspace");

        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        try (ObjectOutputStream out = new ObjectOutputStream(bytes)) {
            out.writeObject(principal);
        }
        try (ObjectInputStream in = new ObjectInputStream(new ByteArrayInputStream(bytes.toByteArray()))) {
            assertEquals(principal, in.readObject());
        }
    }
}

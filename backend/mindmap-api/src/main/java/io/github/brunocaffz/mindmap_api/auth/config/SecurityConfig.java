package io.github.brunocaffz.mindmap_api.auth.config;

import io.github.brunocaffz.mindmap_api.shared.exception.UnauthenticatedException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.logout.CookieClearingLogoutHandler;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.servlet.HandlerExceptionResolver;

/**
 * Regras de acesso, sessão e CSRF.
 *
 * <ul>
 *   <li>Login e callback do OAuth e o logout são públicos (o logout ainda exige o token CSRF).</li>
 *   <li>/api/me e o resto exigem sessão. /api/mindmaps/** também, a menos que app.dev-token-fallback
 *       esteja ligado (só desenvolvimento): aí o serviço usa o token pessoal.</li>
 *   <li>Os erros 401 e 403 são entregues pelo GlobalExceptionHandler, no mesmo formato Problem Details
 *       do resto da API.</li>
 *   <li>CSRF: token em cookie legível pelo front (XSRF-TOKEN), devolvido no cabeçalho X-XSRF-TOKEN.
 *       Só POST, PUT, PATCH e DELETE são conferidos; hoje só o logout.</li>
 * </ul>
 */
@Configuration
@EnableWebSecurity
@EnableConfigurationProperties(AppProperties.class)
public class SecurityConfig {

    static final String LOGOUT_URL = "/api/auth/logout";

    /**
     * Não existe login por usuário e senha: a única entrada é o OAuth do Notion. Declarar este serviço, sem
     * nenhum usuário, impede o Spring Boot de criar o usuário padrão com senha gerada (e de imprimir essa
     * senha no log).
     */
    @Bean
    UserDetailsService noPasswordUsers() {
        return new InMemoryUserDetailsManager();
    }

    @Bean
    SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            AppProperties app,
            SecurityContextRepository contextRepository,
            @Qualifier("handlerExceptionResolver") HandlerExceptionResolver exceptionResolver,
            @Value("${server.servlet.session.cookie.name:SESSION}") String sessionCookieName,
            @Value("${server.servlet.session.cookie.secure:false}") boolean secureCookies) throws Exception {

        CookieCsrfTokenRepository csrfRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfRepository.setCookieCustomizer(cookie -> cookie.secure(secureCookies).sameSite("Lax").path("/"));

        http
                .csrf(csrf -> csrf
                        .csrfTokenRepository(csrfRepository)
                        // O front manda o valor do cookie como está, então não precisa do modo XOR (anti-BREACH
                        // para páginas HTML). Esta API só devolve JSON.
                        .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
                .addFilterAfter(new CsrfCookieFilter(), CsrfFilter.class)
                .securityContext(context -> context.securityContextRepository(contextRepository))
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .requestCache(cache -> cache.disable())
                .logout(logout -> logout
                        .logoutUrl(LOGOUT_URL)
                        .invalidateHttpSession(true)
                        .clearAuthentication(true)
                        .addLogoutHandler(new CookieClearingLogoutHandler(sessionCookieName))
                        .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler(HttpStatus.NO_CONTENT)))
                .authorizeHttpRequests(requests -> {
                    requests.requestMatchers("/api/auth/notion/login", "/api/auth/notion/callback", LOGOUT_URL)
                            .permitAll();
                    requests.requestMatchers("/api/me").authenticated();
                    if (app.devTokenFallback()) {
                        requests.requestMatchers("/api/mindmaps/**").permitAll();
                    } else {
                        requests.requestMatchers("/api/mindmaps/**").authenticated();
                    }
                    requests.anyRequest().authenticated();
                })
                .exceptionHandling(handling -> handling
                        .authenticationEntryPoint((request, response, ex) ->
                                exceptionResolver.resolveException(request, response, null, new UnauthenticatedException()))
                        .accessDeniedHandler((request, response, ex) ->
                                exceptionResolver.resolveException(request, response, null, ex)));

        return http.build();
    }
}

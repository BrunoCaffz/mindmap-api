# Etapa 1: compila o jar com Maven + JDK 21.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
# Baixa as dependências antes de copiar o código, para o cache de camadas valer entre builds.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q package -DskipTests

# Etapa 2: só o JRE 21 enxuto, rodando sem root.
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /build/target/*.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-Xmx512m", "-XX:+UseSerialGC", "-jar", "app.jar"]

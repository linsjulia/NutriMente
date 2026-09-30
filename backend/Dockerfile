# =============================================================
# Imagem da API Java (Spring Boot)
#
# "Multi-stage build": usa duas imagens.
#   1ª (build): tem Maven + JDK completo, compila e gera o .jar.
#   2ª (final): só o Java necessário para RODAR (JRE) + o .jar.
# A imagem final fica bem menor e sem ferramentas de compilação.
# =============================================================

FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
# Baixa as dependências antes de copiar o código: se só o código mudar,
# o Docker reaproveita esta etapa do cache e o build fica rápido.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
# -DskipTests: os testes de integração precisam do banco, rodam à parte
RUN mvn -B -q package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
# Usuário sem privilégios (não roda como root)
RUN useradd --system --uid 1001 nutrimente
COPY --from=build /app/target/api-*.jar app.jar
USER nutrimente
EXPOSE 8080

# O Docker consulta o health check da API para saber se ela está pronta
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
    CMD wget -qO- http://localhost:8080/actuator/health/readiness > /dev/null || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]

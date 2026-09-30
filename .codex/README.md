# Codex en DentAI

Las instrucciones del repositorio están en [AGENTS.md](../AGENTS.md), en la raíz,
y el estado de implementación en [PLAN.md](../PLAN.md).
Esta carpeta documenta la integración local. `config.toml` añade instrucciones
para mantener la autoría del usuario y mensajes centrados en cambios del proyecto.
No configura modelos ni credenciales.

- Trabajar desde la raíz del proyecto con Node 24 y pnpm 12.8.1.
- Conservar cambios existentes y validar los comandos indicados en AGENTS.md.
- Para commits autorizados, leer el agente [committer](../.claude/agents/committer.md)
  y cargar su procedimiento. No hacer push.

Referencia: [documentación oficial de configuración de Codex](https://learn.chatgpt.com/docs/config-file/config-basic).

La clave `developer_instructions` está descrita en la [referencia oficial de configuración](https://learn.chatgpt.com/docs/config-file/config-reference).

## Publicación y autoría

- `config.toml` prohíbe publicar commits y añadir coautores automáticos.
- `rules/no-remote-publication.rules` bloquea los prefijos de publicación Git
  habituales al solicitar ejecución fuera del sandbox. Las variantes que no
  coinciden con un prefijo siguen sujetas a la prohibición de las instrucciones.
- Estas reglas se cargan al iniciar una sesión; la capa del proyecto requiere
  confianza. No modificar las restricciones para conseguir publicar.
- La publicación manual la realiza el usuario desde su terminal.

Referencia: [reglas de ejecución](https://learn.chatgpt.com/docs/agent-configuration/rules).

import { FuenteMensaje } from '@gestion-granjas/database/enums';
import { Injectable, Logger } from '@nestjs/common';
import {
  construirPromptRedaccion,
  LLM_SYSTEM_PROMPT,
  sanitizarMensajeLlm,
  type ContextoRedaccionConsumo,
} from './llm-prompt';

export type ResultadoRedaccion = {
  mensaje: string;
  fuenteMensaje: FuenteMensaje;
  modeloMensaje?: string;
};

type LlmProviderName = 'none' | 'ollama' | 'openai';

@Injectable()
export class LlmRedaccionService {
  private readonly logger = new Logger(LlmRedaccionService.name);

  async redactar(
    contexto: ContextoRedaccionConsumo,
    plantilla: string,
  ): Promise<ResultadoRedaccion> {
    const fallback: ResultadoRedaccion = {
      mensaje: plantilla,
      fuenteMensaje: FuenteMensaje.PLANTILLA,
    };

    const provider = this.resolveProvider();
    if (provider === 'none') return fallback;

    try {
      const generado =
        provider === 'ollama'
          ? await this.llamarOllama(construirPromptRedaccion(contexto))
          : await this.llamarOpenAi(construirPromptRedaccion(contexto));

      const mensaje = sanitizarMensajeLlm(generado.texto);
      if (!mensaje) {
        this.logger.warn(`LLM ${provider} devolvio texto inutilizable; se usa plantilla.`);
        return fallback;
      }

      return {
        mensaje,
        fuenteMensaje:
          provider === 'ollama' ? FuenteMensaje.OLLAMA : FuenteMensaje.OPENAI,
        modeloMensaje: generado.modelo,
      };
    } catch (error) {
      this.logger.warn(
        `LLM ${provider} no disponible; se usa plantilla. ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return fallback;
    }
  }

  private resolveProvider(): LlmProviderName {
    const raw = (process.env.LLM_PROVIDER ?? 'none').trim().toLowerCase();
    if (raw === 'ollama' || raw === 'openai') return raw;
    return 'none';
  }

  private timeoutMs(): number {
    const parsed = Number(process.env.LLM_TIMEOUT_MS ?? 8000);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 8000;
  }

  private async llamarOllama(prompt: string): Promise<{ texto: string; modelo: string }> {
    const baseUrl = (process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(
      /\/$/,
      '',
    );
    const modelo = process.env.OLLAMA_MODEL ?? 'llama3.2';
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelo,
        stream: false,
        options: { temperature: 0.2 },
        messages: [
          { role: 'system', content: LLM_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(this.timeoutMs()),
    });

    if (!response.ok) {
      throw new Error(`Ollama HTTP ${response.status}`);
    }

    const data = (await response.json()) as {
      message?: { content?: string };
    };
    const texto = data.message?.content ?? '';
    return { texto, modelo };
  }

  private async llamarOpenAi(prompt: string): Promise<{ texto: string; modelo: string }> {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY no configurada');
    }

    const modelo = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelo,
        temperature: 0.2,
        messages: [
          { role: 'system', content: LLM_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(this.timeoutMs()),
    });

    if (!response.ok) {
      throw new Error(`OpenAI HTTP ${response.status}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const texto = data.choices?.[0]?.message?.content ?? '';
    return { texto, modelo };
  }
}

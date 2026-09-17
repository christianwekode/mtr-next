import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/icon";

const SUGGESTIONS = [
  {
    prompt: "¿Qué acuerdos se tomaron esta semana en Comercial?",
    label: "Acuerdos comerciales",
  },
  {
    prompt: "Resume las objeciones que salieron en exploración de mercados",
    label: "Objeciones de mercado",
  },
  {
    prompt: "¿Qué hay pendiente de inventario y daily de planta?",
    label: "Inventario de planta",
  },
] as const;

export type EmptyConversationProps = {
  onPick: (text: string) => void;
  compact: boolean;
};

export function EmptyConversation({ onPick, compact }: EmptyConversationProps) {
  if (compact) {
    return <div className="min-h-0 grow" />;
  }

  return (
    <div className="flex min-h-0 w-full grow flex-col items-center justify-center px-6 py-12">
      <div className="flex w-[640px] max-w-full flex-col items-center gap-2">
        <h2 className="text-center font-sans text-xl/7 text-[#141414]">Pregunta sobre tus reuniones</h2>
        <p className="text-center text-[13px]/5 text-[#141414BD]">
          Las grabaciones presenciales se transcriben y quedan en el árbol. Pregunta sobre cualquier carpeta o
          reunión.
        </p>
      </div>
      <div className="flex w-[640px] max-w-full flex-col pt-8">
        <div className="flex w-full flex-col overflow-hidden rounded-xl bg-[#FCFCFC] shadow-[0_0_0_1px_#1414140A]">
          {SUGGESTIONS.map((item, index) => (
            <div key={item.label}>
              {index > 0 ? (
                <div className="flex h-px w-full shrink-0 px-4">
                  <div className="h-px grow bg-[#1414140A]" />
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => onPick(item.prompt)}
                className="flex w-full items-center gap-5 px-4 py-3 text-left"
              >
                <div className="flex min-w-0 grow items-start gap-2.5">
                  <div
                    className="size-8 shrink-0 overflow-hidden rounded-md"
                    style={{ background: "linear-gradient(180deg, #d7eef8 0%, #7ec8e3 100%)" }}
                  />
                  <div className="flex min-w-0 grow flex-col gap-0.5">
                    <span className="text-[13px]/5 text-[#141414]">{item.prompt}</span>
                    <span className="text-[13px]/[18px] text-[#141414BD]">{item.label}</span>
                  </div>
                </div>
                <Icon icon={ArrowRight01Icon} size={14} color="#14141447" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

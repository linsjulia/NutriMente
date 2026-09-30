import { useId, useState } from "react"

interface GenderButtonProps {
    // id do texto que dá nome ao grupo (ex.: "Gênero"), lido pelo leitor de tela
    labelledBy?: string
}

export default function GenderButton({ labelledBy }: GenderButtonProps){
    const [selected, setSelected] = useState("women");
    // useId gera um id único: evita dois grupos na mesma página com ids iguais
    const groupId = useId();

    const options = [
        { id: "women", label: "Feminino" },
        { id: "men", label: "Masculino" },
    ]
    return(
        // role="radiogroup" + aria-labelledby: o leitor de tela anuncia
        // "Gênero, grupo de opções" antes de ler Feminino/Masculino
        <div className="input-gender" role="radiogroup" aria-labelledby={labelledBy}>
            {options.map((opt) => (
              <div key={opt.id} >
                <input
                  type="radio"
                  name={`gender-${groupId}`}
                  id={`${groupId}-${opt.id}`}
                  value={opt.id}
                  checked={selected == opt.id}
                  onChange={() => setSelected(opt.id)}
                />
                <label htmlFor={`${groupId}-${opt.id}`}>{opt.label}</label>
              </div>
            ))}
          </div>
    )
}

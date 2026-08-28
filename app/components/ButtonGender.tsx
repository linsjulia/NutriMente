import { useState } from "react"

export default function ButtonGender(){
    const [selected, setSelected] = useState("women");

    const options = [
        { id: "women", label: "Feminino" },
        { id: "men", label: "Masculino" },
    ]
    return(
        <div className="input-gender ">
            {options.map((opt) => (
              <div key={opt.id} >
                <input
                  type="radio"
                  name="gender"
                  id={opt.id}
                  checked={selected == opt.id}
                  onChange={() => setSelected(opt.id)}
                />
                <label htmlFor={opt.id}>{opt.label}</label>
              </div>
            ))}
          </div>
    )
}
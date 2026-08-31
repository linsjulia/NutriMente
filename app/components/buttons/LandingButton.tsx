import React from "react";

export default function LandingButton() {
  return (
    <div>
      <button className="button-test flex items-center rounded-4xl mb-10 p-2font-bold">
        <img src="/icons/cronograma.png" alt="" className="w-10 mx-2"/>
        <span className="button__text">Agendar uma consulta</span>
      </button>
    </div>
  );
}

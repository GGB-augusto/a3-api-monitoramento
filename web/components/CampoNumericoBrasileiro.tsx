'use client';

import { useEffect, useState } from 'react';
import {
  filtrarEntradaNumericaBrasileira,
  formatarNumeroBrasileiro,
  interpretarNumeroBrasileiro,
} from '@/lib/numero-brasileiro';

type CampoNumericoBrasileiroProps = {
  name: string;
  label: string;
  unidade: string;
  valor?: number;
};

export function CampoNumericoBrasileiro({ name, label, unidade, valor }: CampoNumericoBrasileiroProps) {
  const [texto, setTexto] = useState(formatarNumeroBrasileiro(valor));

  useEffect(() => {
    setTexto(formatarNumeroBrasileiro(valor));
  }, [valor]);

  return (
    <label className="numeric-field">
      {label}
      <span className="numeric-input-wrap">
        <input
          name={name}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          required
          value={texto}
          onChange={event => {
            const entrada = event.currentTarget.value;
            const filtrada = filtrarEntradaNumericaBrasileira(entrada);
            if (filtrada === null) {
              setTexto('');
              event.currentTarget.setCustomValidity('Use apenas números, ponto para milhares e vírgula para decimais.');
              return;
            }
            event.currentTarget.setCustomValidity('');
            setTexto(filtrada);
          }}
          onBlur={() => {
            const numero = interpretarNumeroBrasileiro(texto);
            if (numero !== null) setTexto(formatarNumeroBrasileiro(numero));
          }}
          aria-label={`${label} em ${unidade}`}
          placeholder="0,00"
        />
        <span className="numeric-unit" aria-hidden="true">{unidade}</span>
      </span>
    </label>
  );
}

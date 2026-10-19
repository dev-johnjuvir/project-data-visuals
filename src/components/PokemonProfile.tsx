import Image from 'next/image';
import { capitalize, formatName } from '@/lib/transforms';
import type { Pokemon } from '@/lib/types';

export function PokemonProfile({ pokemon, averageTotal }: { pokemon: Pokemon; averageTotal: number }) {
  const delta = pokemon.total - averageTotal;
  return (
    <div className="pokemon-profile">
      {pokemon.sprite && (
        <Image className="pokemon-profile__sprite" src={pokemon.sprite} alt="" width={72} height={72} />
      )}
      <div className="pokemon-profile__info">
        <p className="pokemon-profile__number">#{String(pokemon.id).padStart(3, '0')}</p>
        <p className="pokemon-profile__name">{formatName(pokemon.name)}</p>
        <ul className="pokemon-profile__types">
          {pokemon.types.map((type) => (
            <li key={type} className="pokemon-profile__type">
              {capitalize(type)}
            </li>
          ))}
        </ul>
      </div>
      <div className="pokemon-profile__total">
        <p className="pokemon-profile__total-value">{pokemon.total}</p>
        <p className="pokemon-profile__total-label">
          stat total · {delta >= 0 ? '+' : '−'}
          {Math.abs(delta)} vs avg
        </p>
      </div>
    </div>
  );
}

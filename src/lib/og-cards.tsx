import { ImageResponse } from 'next/og';
import { maxIndex } from 'd3';
import { COLORS, SITE_NAME, TYPE_COLORS } from './brand';
import { generationSize, type Generation } from './generations';
import { LABEL, OG_SIZE, OgLights, OgPage, PIXEL, loadImageDataUri, ogFonts } from './og';
import { getPokemon } from './pokeapi';
import { capitalize, countByPrimaryType, formatName, formatPercent } from './transforms';

const card = {
  display: 'flex',
  background: COLORS.paper,
  border: `5px solid ${COLORS.ink}`,
  borderRadius: 24,
  boxShadow: `9px 9px 0 ${COLORS.ink}`,
} as const;

/**
 * Preview card for a region's charts page: the red header, the region's
 * top five types as bars, and its strongest Pokémon - real data, so every
 * region's link preview is different.
 */
export async function chartsCard(generation: Generation): Promise<ImageResponse> {
  const pokemon = await getPokemon(generation);
  const top = countByPrimaryType(pokemon).slice(0, 5);
  const strongest = pokemon[maxIndex(pokemon, (p) => p.total)];
  const largest = top[0].count;

  const eyebrow = `POKEAPI · GENERATION ${generation.numeral} · ${generation.region.toUpperCase()}`;
  const strongestName = formatName(strongest.name);
  const fonts = await ogFonts(
    `${SITE_NAME}${eyebrow}SHARE BY PRIMARY TYPESTRONGESTENTRIES${strongestName}${top.map((t) => capitalize(t.type)).join('')}0123456789·%`,
  );

  return new ImageResponse(
    (
      <OgPage>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            padding: '34px 56px 36px',
            background: COLORS.dexRed,
            borderBottom: `9px solid ${COLORS.ink}`,
            color: COLORS.paper,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <OgLights />
            <div style={{ display: 'flex', fontFamily: LABEL, fontSize: 20 }}>{eyebrow}</div>
          </div>
          <div style={{ display: 'flex', fontSize: 96, fontWeight: 700, lineHeight: 1, textShadow: `7px 7px 0 ${COLORS.ink}` }}>{SITE_NAME}</div>
        </div>

        <div style={{ display: 'flex', gap: 32, padding: '30px 56px 40px', flex: 1 }}>
          {/* Top five types */}
          <div style={{ ...card, flex: 1, flexDirection: 'column', gap: 14, padding: '22px 28px' }}>
            <div style={{ display: 'flex', fontFamily: LABEL, fontSize: 15, color: COLORS.labelRed }}>SHARE BY PRIMARY TYPE</div>
            {top.map((t) => (
              <div key={t.type} style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 24 }}>
                <div style={{ display: 'flex', width: 120 }}>{capitalize(t.type)}</div>
                <div
                  style={{
                    display: 'flex',
                    flex: 1,
                    height: 22,
                    background: COLORS.track,
                    border: `3px solid ${COLORS.ink}`,
                    borderRadius: 6,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${(t.count / largest) * 100}%`,
                      background: TYPE_COLORS[t.type] ?? COLORS.track,
                      borderRight: `3px solid ${COLORS.ink}`,
                    }}
                  />
                </div>
                {/* One template string = one text node (see og.tsx on display: flex) */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', width: 110 }}>
                  {`${t.count} · ${formatPercent(t.count / pokemon.length)}`}
                </div>
              </div>
            ))}
          </div>

          {/* Headline numbers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: 300 }}>
            <div style={{ ...card, flex: 1, flexDirection: 'column', justifyContent: 'center', gap: 6, padding: '14px 24px' }}>
              <div style={{ display: 'flex', fontFamily: LABEL, fontSize: 14, color: COLORS.labelRed }}>ENTRIES</div>
              <div style={{ display: 'flex', fontSize: 56, fontWeight: 700, lineHeight: 1 }}>{generationSize(generation)}</div>
            </div>
            <div
              style={{
                ...card,
                flex: 1.4,
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 6,
                padding: '14px 24px',
                background: COLORS.yellow,
              }}
            >
              <div style={{ display: 'flex', fontFamily: LABEL, fontSize: 14 }}>STRONGEST</div>
              <div style={{ display: 'flex', fontSize: 56, fontWeight: 700, lineHeight: 1 }}>{strongest.total}</div>
              <div style={{ display: 'flex', fontSize: 24 }}>{strongestName}</div>
            </div>
          </div>
        </div>
      </OgPage>
    ),
    { ...OG_SIZE, fonts },
  );
}

const artwork = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

/**
 * Preview card for a region's Field Dex: the red device, with the region's
 * three starters on its screen. Every generation's Pokédex opens with its
 * grass, fire and water starters at #1, #4 and #7 of its range.
 */
export async function dexCard(generation: Generation): Promise<ImageResponse> {
  const starterIds = [0, 3, 6].map((offset) => generation.first + offset);
  const starters = (await Promise.all(starterIds.map((id) => loadImageDataUri(artwork(id))))).filter(
    (src): src is string => src !== null,
  );

  const model = `FIELD DEX R-${generation.id}`;
  const line = `Region ${generation.numeral} · ${generation.region} · ${generationSize(generation)} entries`;
  const fonts = await ogFonts(`${model}${line}${SITE_NAME}SCANStats, info, rankings and cries for every entry`);

  return new ImageResponse(
    (
      <OgPage>
        <div style={{ display: 'flex', flex: 1, padding: 40 }}>
          {/* The casing */}
          <div
            style={{
              display: 'flex',
              flex: 1,
              gap: 36,
              padding: '34px 40px',
              background: COLORS.dexRed,
              border: `6px solid ${COLORS.ink}`,
              borderRadius: 56,
              boxShadow: `12px 12px 0 ${COLORS.ink}, inset 0 -12px 0 ${COLORS.casingShade}, inset 0 9px 0 ${COLORS.casingShine}`,
              color: COLORS.paper,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 400 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <OgLights />
                <div style={{ display: 'flex', fontFamily: LABEL, fontSize: 26 }}>{model}</div>
                <div style={{ display: 'flex', fontSize:66, fontWeight: 700, lineHeight: 1, textShadow: `6px 6px 0 ${COLORS.ink}` }}>
                  {SITE_NAME}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 28 }}>
                <div style={{ display: 'flex' }}>{line}</div>
                <div style={{ display: 'flex', fontSize:24, color: '#ffe9a8' }}>Stats, info, rankings and cries for every entry</div>
              </div>
            </div>

            {/* The screen */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                gap: 12,
                padding: 18,
                background: COLORS.bezel,
                border: `6px solid ${COLORS.ink}`,
                borderRadius: 30,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: 999, background: '#ff6b5e' }} />
                <div style={{ display: 'flex', fontFamily: LABEL, fontSize: 13, color: '#b9bcd0' }}>SCAN</div>
              </div>
              <div
                style={{
                  display: 'flex',
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  overflow: 'hidden',
                  background: COLORS.lcd,
                  border: `5px solid ${COLORS.ink}`,
                  borderRadius: 18,
                }}
              >
                {starters.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element -- rendered to PNG by next/og
                  <img key={i} src={src} width={164} height={164} alt="" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </OgPage>
    ),
    { ...OG_SIZE, fonts },
  );
}

import { DayWorkout, LiftOfTheMonth, MonthlyPlan, MovementPattern } from '../types/workout';
import { ONE_WORKOUT_DAYS, LIFT_OF_THE_MONTH } from '../data/onePlanData';

export const CSV_HEADER = 'seccion,dia,titulo_dia,subtitulo,coaching_tip,nombre,patron,series,reps,equipo,notas,lift_of_the_month';

/**
 * Converts a MonthlyPlan object into a CSV string.
 */
export function exportPlanToCSV(plan: MonthlyPlan): string {
  const rows: string[] = [];

  // Metadatos del mes en la primera fila o como cabecera
  // Formato: seccion,dia,titulo_dia,subtitulo,coaching_tip,nombre,patron,series,reps,equipo,notas,lift_of_the_month
  rows.push(CSV_HEADER);

  // Meta row: Mes y Bloque
  rows.push([
    'META',
    escapeCSV(plan.monthName),
    escapeCSV(plan.blockName || ''),
    '',
    '',
    escapeCSV(plan.liftOfTheMonth.name),
    '',
    '',
    escapeCSV(plan.liftOfTheMonth.targetReps),
    '',
    escapeCSV(plan.liftOfTheMonth.tips),
    'true',
  ].join(','));

  plan.workoutDays.forEach((day) => {
    // 1. Movilidad
    day.mobility.forEach((item) => {
      rows.push([
        'MOVILIDAD',
        escapeCSV(day.dayName),
        escapeCSV(day.dayTitle),
        escapeCSV(day.subtitle),
        escapeCSV(day.coachingTip),
        escapeCSV(item),
        '',
        '',
        '',
        '',
        '',
        '',
      ].join(','));
    });

    // 2. Activación
    day.activation.forEach((item) => {
      rows.push([
        'ACTIVACION',
        escapeCSV(day.dayName),
        escapeCSV(day.dayTitle),
        escapeCSV(day.subtitle),
        escapeCSV(day.coachingTip),
        escapeCSV(item),
        '',
        '',
        '',
        '',
        '',
        '',
      ].join(','));
    });

    // 3. Ejercicios de Fuerza
    day.exercises.forEach((ex) => {
      rows.push([
        'FUERZA',
        escapeCSV(day.dayName),
        escapeCSV(day.dayTitle),
        escapeCSV(day.subtitle),
        escapeCSV(day.coachingTip),
        escapeCSV(ex.name),
        escapeCSV(ex.pattern),
        ex.targetSets.toString(),
        escapeCSV(ex.targetReps),
        escapeCSV(ex.equipment),
        escapeCSV(ex.notes || ''),
        ex.isLiftOfTheMonth ? 'true' : 'false',
      ].join(','));
    });

    // 4. Finisher
    rows.push([
      'FINISHER',
      escapeCSV(day.dayName),
      escapeCSV(day.dayTitle),
      escapeCSV(day.subtitle),
      escapeCSV(day.coachingTip),
      escapeCSV(day.finisher.title),
      escapeCSV(day.finisher.timerConfig?.type || 'amrap'),
      (day.finisher.timerConfig?.totalMinutes || 6).toString(),
      escapeCSV(day.finisher.duration),
      escapeCSV(day.finisher.format),
      escapeCSV(day.finisher.details.join(' | ')),
      '',
    ].join(','));
  });

  return rows.join('\n');
}

function escapeCSV(val: string): string {
  if (val === undefined || val === null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Robust CSV parser that handles quotes, escaped quotes and multi-line cells.
 */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentCell += '"';
          i++;
        } else {
          insideQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\r') {
        // Skip carriage return
      } else if (char === '\n') {
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Converts parsed CSV rows into a validated MonthlyPlan.
 */
export function importPlanFromCSV(csvText: string): { plan: MonthlyPlan; error?: string } {
  const rows = parseCSV(csvText);
  if (rows.length < 2) {
    return { plan: createDefaultMonthlyPlan(), error: 'El archivo CSV está vacío o incompleto.' };
  }

  let monthName = 'RUTINA';
  let blockName = 'BASE - CONTROL - PROGRESIÓN';
  let liftOfTheMonth: LiftOfTheMonth = {
    name: 'Trap Bar Deadlift',
    exerciseId: 'trap_bar_deadlift',
    tagline: 'Lift of the Month',
    tips: 'Posición neutra de columna, empuja el suelo con los pies y mantén el agarre firme.',
    targetReps: '3 x 6-8',
  };

  const daysMap = new Map<string, DayWorkout>();

  const dayOrder = ['LUNES', 'MARTES', 'MIÉRCOLES', 'MIERCOLES', 'JUEVES', 'VIERNES'];
  const dayIdMap: Record<string, string> = {
    LUNES: 'lunes',
    MARTES: 'martes',
    MIÉRCOLES: 'miercoles',
    MIERCOLES: 'miercoles',
    JUEVES: 'jueves',
    VIERNES: 'viernes',
  };

  // Helper to ensure a DayWorkout exists in daysMap
  const getOrCreateDay = (rawDayName: string, title?: string, sub?: string, tip?: string): DayWorkout => {
    const norm = rawDayName.toUpperCase().trim();
    const id = dayIdMap[norm] || norm.toLowerCase().replace(/\s+/g, '_');
    if (!daysMap.has(id)) {
      daysMap.set(id, {
        id,
        dayName: norm,
        dayTitle: title || norm,
        subtitle: sub || '',
        coachingTip: tip || '',
        mobility: [],
        activation: [],
        exercises: [],
        finisher: {
          title: 'FINISHER',
          duration: '8 min',
          format: 'FINISHER 8\'',
          details: [],
          timerConfig: {
            type: 'amrap',
            totalMinutes: 6,
          },
        },
      });
    }
    const existing = daysMap.get(id)!;
    if (title && (!existing.dayTitle || existing.dayTitle === existing.dayName)) existing.dayTitle = title;
    if (sub && !existing.subtitle) existing.subtitle = sub;
    if (tip && !existing.coachingTip) existing.coachingTip = tip;
    return existing;
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (i === 0 && row[0]?.toLowerCase().includes('seccion')) {
      continue; // Skip header row
    }

    const [
      seccionRaw = '',
      diaRaw = '',
      tituloDia = '',
      subtitulo = '',
      coachingTip = '',
      nombre = '',
      patronRaw = '',
      seriesRaw = '',
      reps = '',
      equipoRaw = '',
      notas = '',
      liftParam = '',
    ] = row;

    const seccion = seccionRaw.toUpperCase().trim();

    if (seccion === 'META') {
      if (diaRaw) monthName = diaRaw.toUpperCase().trim();
      if (tituloDia) blockName = tituloDia.trim();
      if (nombre) {
        liftOfTheMonth = {
          name: nombre.trim(),
          exerciseId: slugify(nombre),
          tagline: `Lift of the Month · ${monthName}`,
          tips: notas || 'Mantén la técnica estricta y progresión semanal.',
          targetReps: reps || '3 x 6-8',
        };
      }
      continue;
    }

    if (!diaRaw) continue;
    const day = getOrCreateDay(diaRaw, tituloDia, subtitulo, coachingTip);

    if (seccion === 'MOVILIDAD') {
      if (nombre && !day.mobility.includes(nombre.trim())) {
        day.mobility.push(nombre.trim());
      }
    } else if (seccion === 'ACTIVACION' || seccion === 'ACTIVACIÓN') {
      if (nombre && !day.activation.includes(nombre.trim())) {
        day.activation.push(nombre.trim());
      }
    } else if (seccion === 'FUERZA' || seccion === 'ESTACIONES' || seccion === 'EJERCICIO') {
      if (nombre) {
        const isLotm = liftParam.toLowerCase() === 'true' || liftParam === '1';
        const pattern = normalizePattern(patronRaw);
        const equipment = normalizeEquipment(equipoRaw);
        const setsCount = parseInt(seriesRaw, 10) || 3;

        day.exercises.push({
          id: slugify(nombre),
          name: nombre.trim(),
          pattern,
          targetSets: setsCount,
          targetReps: reps || `${setsCount} x 10`,
          equipment,
          notes: notas || undefined,
          isLiftOfTheMonth: isLotm,
        });

        if (isLotm && !liftOfTheMonth.name) {
          liftOfTheMonth = {
            name: nombre.trim(),
            exerciseId: slugify(nombre),
            tagline: `Lift of the Month · ${monthName}`,
            tips: notas || '',
            targetReps: reps || `${setsCount} x 8`,
          };
        }
      }
    } else if (seccion === 'FINISHER' || seccion === 'CARDIO') {
      const typeRaw = patronRaw.toLowerCase().trim();
      const validTimerType: 'emom' | 'tabata' | 'amrap' | 'intervals' =
        typeRaw === 'emom' || typeRaw === 'tabata' || typeRaw === 'amrap' || typeRaw === 'intervals'
          ? typeRaw
          : 'amrap';

      const totalMins = parseInt(seriesRaw, 10) || 6;
      const detailsArray = notas ? notas.split('|').map((s) => s.trim()).filter(Boolean) : [];

      day.finisher = {
        title: nombre || 'FINISHER CARDIO',
        duration: reps || `${totalMins} min`,
        format: equipoRaw || `${validTimerType.toUpperCase()} ${totalMins}'`,
        details: detailsArray.length > 0 ? detailsArray : [nombre || 'Trabajo por tiempo'],
        timerConfig: {
          type: validTimerType,
          totalMinutes: totalMins,
        },
      };
    }
  }

  // Convert map to sorted array based on dayOrder
  const sortedDays = Array.from(daysMap.values()).sort((a, b) => {
    const idxA = dayOrder.indexOf(a.dayName);
    const idxB = dayOrder.indexOf(b.dayName);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.id.localeCompare(b.id);
  });

  if (sortedDays.length === 0) {
    return { plan: createDefaultMonthlyPlan(), error: 'No se encontraron días de entrenamiento válidos en el CSV.' };
  }

  return {
    plan: {
      monthName,
      blockName,
      liftOfTheMonth,
      workoutDays: sortedDays,
    },
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizePattern(raw: string): MovementPattern {
  const norm = raw.toLowerCase().trim();
  if (norm.includes('sentadilla') || norm.includes('squat') || norm.includes('lunge') || norm.includes('pierna')) return 'sentadilla';
  if (norm.includes('empuje') || norm.includes('press') || norm.includes('push')) return 'empuje';
  if (norm.includes('traccion') || norm.includes('tracción') || norm.includes('pull') || norm.includes('remo')) return 'traccion';
  if (norm.includes('bisagra') || norm.includes('deadlift') || norm.includes('peso muerto') || norm.includes('thrust') || norm.includes('femoral') || norm.includes('gluteo')) return 'bisagra';
  if (norm.includes('core') || norm.includes('plank') || norm.includes('pallof') || norm.includes('abdomen')) return 'core';
  return 'empuje';
}

function normalizeEquipment(raw: string): 'barra' | 'mancuernas' | 'polea' | 'sandbag' | 'peso_corporal' | 'kettlebell' | 'trineo' | 'otro' {
  const norm = raw.toLowerCase().trim();
  if (norm.includes('barra')) return 'barra';
  if (norm.includes('mancuerna')) return 'mancuernas';
  if (norm.includes('polea') || norm.includes('cable')) return 'polea';
  if (norm.includes('sandbag') || norm.includes('saco')) return 'sandbag';
  if (norm.includes('corporal') || norm.includes('bodyweight')) return 'peso_corporal';
  if (norm.includes('kettlebell') || norm.includes('kb') || norm.includes('pesa rusa')) return 'kettlebell';
  if (norm.includes('trineo') || norm.includes('sled')) return 'trineo';
  return 'otro';
}

export function createDefaultMonthlyPlan(): MonthlyPlan {
  return {
    monthName: 'OCTUBRE',
    blockName: 'BASE - CONTROL - PROGRESIÓN',
    liftOfTheMonth: LIFT_OF_THE_MONTH,
    workoutDays: ONE_WORKOUT_DAYS,
  };
}

/**
 * Returns the Gemini Prompt ready for the user to copy-paste along with their whiteboard image.
 */
export function getGeminiConversionPrompt(): string {
  return `Actúa como asistente experto de fitness y digitalización de pizarras de entrenamiento para la app GimyOne.
Por favor, analiza la imagen de la pizarra ONE Strength & Conditioning adjunta y conviértela estrictamente al siguiente formato CSV estándar:

seccion,dia,titulo_dia,subtitulo,coaching_tip,nombre,patron,series,reps,equipo,notas,lift_of_the_month

Instrucciones exactas:
1. Primera fila debe ser la fila META:
   META,[MES],[NOMBRE DEL BLOQUE],,,[NOMBRE DEL LIFT OF THE MONTH],,,[REPS LIFT],,[TIPS DEL LIFT],true
   (Ejemplo: META,NOVIEMBRE,FUERZA Y POTENCIA,,,Trap Bar Deadlift,,,3 x 6-8,Pecho alto y cadera firme,true)

2. Para cada día de la semana (LUNES a VIERNES):
   - Fila de tipo "MOVILIDAD" para cada ejercicio de movilidad (campo 'nombre').
   - Fila de tipo "ACTIVACION" para cada ejercicio de activación (campo 'nombre').
   - Fila de tipo "FUERZA" para cada ejercicio principal. Incluye:
     * patron: sentadilla | empuje | traccion | bisagra | core
     * series: número entero (ej. 3 o 4)
     * reps: texto de repeticiones (ej. 3 x 10 o 3 x 8-10 / lado)
     * equipo: barra | mancuernas | polea | sandbag | peso_corporal | kettlebell | trineo | otro
     * notas: indicaciones técnicas
     * lift_of_the_month: true si es el ejercicio destacado del mes, false en caso contrario
   - Fila de tipo "FINISHER":
     * patron: emom | tabata | amrap | intervals
     * series: duración total en minutos (número entero, ej. 8)
     * reps: descripción de tiempo (ej. 8 min)
     * equipo: formato (ej. EMOM 8' o TABATA 20/10)
     * notas: detalles separados por barra vertical | (ej. Min 1: Swings x 15 | Min 2: Burpees x 8)

Responde ÚNICAMENTE con el bloque de texto CSV, sin explicaciones ni rodeos, listo para copiar y pegar o guardar como archivo .csv.`;
}

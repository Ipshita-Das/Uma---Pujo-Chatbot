// Small line icons in the app's ink style (rounded 2px strokes), used instead of emojis.
// They take the text colour, so they work on light and red backgrounds alike.

function Icon({ children, size = 20, className = '' }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

// A clay bhar of cha, with steam: for adda
export const ChaIcon = (p) => (
  <Icon {...p}>
    <path d="M5 10h11l-1.2 8.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8Z" />
    <path d="M16 12h1.5a2 2 0 0 1 0 4H15.4" />
    <path d="M9 3.5c-.8 1 .8 2 0 3M12.5 3.5c-.8 1 .8 2 0 3" />
  </Icon>
)

// A pandal gate with a pointed roof: for pandal hopping
export const PandalIcon = (p) => (
  <Icon {...p}>
    <path d="M3 10 12 3l9 7" />
    <path d="M5 9v11h14V9" />
    <path d="M9.5 20v-5a2.5 2.5 0 0 1 5 0v5" />
    <path d="M3 20h18" />
  </Icon>
)

// A folded saree with a border: for outfits
export const SareeIcon = (p) => (
  <Icon {...p}>
    <path d="M7 3h7l4 5-3 13H6L4 8Z" />
    <path d="M14 3 11 21" />
    <path d="M5 17.5h10.8" />
  </Icon>
)

// A phuchka plate: for street food
export const FoodIcon = (p) => (
  <Icon {...p}>
    <path d="M3 13h18a9 5 0 0 1-18 0Z" />
    <circle cx="8" cy="10" r="2.5" />
    <circle cx="13" cy="9" r="2.5" />
    <circle cx="17.5" cy="10.5" r="2" />
  </Icon>
)

// An envelope with a small heart: for the greeting card
export const CardIcon = (p) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 6 8.5 7 8.5-7" />
  </Icon>
)

export const CameraIcon = (p) => (
  <Icon {...p}>
    <path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
    <circle cx="12" cy="13" r="3.5" />
  </Icon>
)

export const CloseIcon = (p) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
)

export const PlusIcon = (p) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)

export const PencilIcon = (p) => (
  <Icon {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16Z" />
    <path d="m13.5 6.5 4 4" />
  </Icon>
)

export const TrashIcon = (p) => (
  <Icon {...p}>
    <path d="M4 7h16M9 7V4h6v3" />
    <path d="M6 7l1 13h10l1-13" />
    <path d="M10 11v5M14 11v5" />
  </Icon>
)

// A map pin: for Google Maps directions
export const MapPinIcon = (p) => (
  <Icon {...p}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Icon>
)

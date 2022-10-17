export interface ButtonField {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  display?: boolean;
  color?: string;
  text?: string;
  hideOnClick?: boolean;
  fontSize?: number;
  onActive?: (active: boolean, button?: ButtonField) => void | Promise<void>;
  onClick: (
    x?: number,
    y?: number,
    button?: ButtonField
  ) => void | Promise<void>;
}

export class Button {
  public key: string;
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public display?: boolean;
  public color?: string;
  public text?: string;
  public hideOnClick?: boolean;
  public fontSize: number;

  public onActive?: (
    active: boolean,
    button?: ButtonField
  ) => void | Promise<void>;
  public onClick: (
    x?: number,
    y?: number,
    button?: ButtonField
  ) => void | Promise<void>;

  constructor({
    key,
    x,
    y,
    width,
    height,
    onClick,
    display,
    color,
    text,
    fontSize = 30,
    hideOnClick,
    onActive,
  }: {
    key: string;
    x: number;
    y: number;
    width: number;
    height: number;
    onClick: (
      x?: number,
      y?: number,
      button?: ButtonField
    ) => void | Promise<void>;
    display?: boolean;
    color?: string;
    text?: string;
    fontSize?: number;

    hideOnClick?: boolean;
    onActive?: (active: boolean, button?: ButtonField) => void | Promise<void>;
  }) {
    this.key = key;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.display = display;
    this.color = color;
    this.text = text;
    this.fontSize = fontSize;
    this.hideOnClick = hideOnClick;
    this.onActive = onActive;
    this.onClick = onClick;
  }
}

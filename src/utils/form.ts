///
/// types
///
type IValidator = (value: any) => boolean;
type ValueChangeOriginal<T> = (value: T) => void;
export type ValueChangeArgs<T> = { value: T; valid: boolean };
export type ValueChange<T> = (value: ValueChangeArgs<T>) => void;
export type ValueGetter<T> = () => T;
export interface IValidatorContext<T> {
  isValid: IValidator;
  isNotValid: IValidator;
  changeCallback: (onChange: ValueChange<T>) => ValueChangeOriginal<T>;
}
///
/// validators: take as parameter a string and return true if valid
///
function notEmpty(text: string) {
  return !!text && text.trim().length > 0;
}
function matchRegex(text: string, regex: RegExp | string) {
  if (!text || !regex) {
    return true; //skip validation
  }
  const regexObject = typeof regex === 'string' ? new RegExp(regex) : regex;
  return regexObject.test(text);
}
function compareString(text1: string, text2: string, match: boolean) {
  return match ? text1 === text2 : text1 !== text2;
}

///
/// validator builder: lets compose multiple validator as one big validator
///
export class ValidatorBuilder {
  static mailRegex =
    // eslint-disable-next-line no-useless-escape
    /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;

  static phoneRegex = /^(00|\+)?(?:[0-9] ?-?\.?){6,15}$/;

  validators: IValidator[] = [];

  withRequired(required: boolean) {
    if (required) {
      this.validators.push(notEmpty);
    }
    return this;
  }
  withRegex(regex: RegExp | string) {
    this.validators.push(value => {
      return matchRegex(value, regex);
    });
    return this;
  }

  withPhone() {
    return this.withRegex(ValidatorBuilder.phoneRegex);
  }

  withEmail() {
    return this.withRegex(ValidatorBuilder.mailRegex);
  }

  withCompareString(other: ValueGetter<string>, match: boolean) {
    this.validators.push(value => {
      return compareString(value, other(), match);
    });
    return this;
  }

  build<T>(): IValidatorContext<T> {
    const isValid = value => {
      let valid = true;
      for (const va of this.validators) {
        if (!va(value)) {
          valid = false;
        }
      }
      return valid;
    };
    return {
      isValid,
      isNotValid: value => !isValid(value),
      changeCallback(onChange: ValueChange<T>) {
        return value => onChange({ value, valid: isValid(value) });
      },
    };
  }
}

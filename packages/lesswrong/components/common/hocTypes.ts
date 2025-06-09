import type { RouterLocation } from '../../lib/vulcan-lib/routes';
import type { JssStylesCallback } from '@/lib/jssStyles';
import type { StyleDefinition } from '@/server/styleGeneration';

declare global {

type AnyStyles = JssStylesCallback<string>;

type ClassesType<
  Styles extends JssStylesCallback<ClassKey>,
  ClassKey extends string = string
> = Readonly<Record<keyof ReturnType<Styles>, string>>;

interface WithStylesProps<T extends StyleDefinition<any>=any> {
  classes: ClassesType<T["styles"]>,
}

interface WithUserProps {
  currentUser: UsersCurrent|null,
}

interface WithTrackingProps {
  captureEvent: any,
}

interface WithTimezoneProps {
  timezone: string,
  timezoneIsKnown: boolean,
}

interface WithLocationProps {
  location: RouterLocation,
}

interface WithDialogProps {
  openDialog: any,
}

interface WithGlobalKeydownProps {
  addKeydownListener: any,
}

// This is a bit arcane. I think of this basically as a type "function" that
// says, for a given collection base, I am the DbObject extension it is using.
// https://stackoverflow.com/questions/63631364/infer-nested-generic-types-in-typescript/63631544#63631544
type DbObjectForCollectionBase<C> = C extends CollectionBase<infer T> ? T : never

type NullablePartial<T> = { [K in keyof T]?: T[K]|null|undefined }

}

/**
 * This class is used to observe and add all the columns that are considered as a state change in the entities. Its use is to audit changes in the database.
 */
export class StateChangeProperties {
  /**
   * All entities and properties that symbolize a change of state
   */
  static mapEntities = new Map<string, string[]>([]);
}